// FileUpload.js
import React, { useState, useRef } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import PropTypes from 'prop-types';
// Instead of importing axios directly, import your custom axios instance:
import app from '../utils/axiosConfig'; // or the correct path

export const FileUpload = ({ onColumnsUpdate, onUploadSuccess  }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);


  // API endpoint configuration based on environment
  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://calculator.qodeinvest.com'
    : 'http://192.168.0.106:5080';

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
    }
  };

  const checkSession = async () => {
    try {
      // Now call your custom axios instance
      const response = await app.get('/api/upload/check_session');
      console.log('Session check:', response.data);
    } catch (err) {
      console.error('Session check failed:', err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Use your custom axios instance instead of `axios.post`
      const uploadResponse = await app.post(
        `${API_BASE_URL}/api/upload/upload_strategy`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
          // No need to pass "withCredentials" here, 
          // because your custom axios instance already has it set to true.
        }
      );

      console.log('Upload response:', uploadResponse.data);

      if (uploadResponse.status === 200) {
        setSuccess(true);
        setFile(null);
        fileInputRef.current.value = null;
        const { columns } = uploadResponse.data;
        onColumnsUpdate(columns);
        
        // Call onUploadSuccess with filename and other data
        onUploadSuccess({
          filename: file.name,
          columns: columns
        });
        if (columns && Array.isArray(columns)) {
          onColumnsUpdate(columns);

          // Check session after successful upload
          await checkSession();
        } else {
          setError('No columns returned from the server.');
          console.error('No columns found in response:', uploadResponse.data);
        }
      } else {
        setError('Failed to upload file.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload file');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <div className="mb-3">
        <Form.Label>Upload Custom Strategy (CSV)</Form.Label>
        <Form.Control
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={loading}
        />
        <Form.Text className="text-muted">
          Upload a CSV file with your custom strategy data
        </Form.Text>
      </div>
      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
      {success && <Alert variant="success" className="mb-3">Strategy uploaded successfully!</Alert>}
      <Button
        onClick={handleUpload}
        disabled={!file || loading}
        variant="primary"
      >
        {loading ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
              className="me-2"
            />
            Uploading...
          </>
        ) : (
          'Upload Strategy'
        )}
      </Button>
    </div>
  );
};

FileUpload.propTypes = {
  onColumnsUpdate: PropTypes.func.isRequired,
  onUploadSuccess: PropTypes.func
};