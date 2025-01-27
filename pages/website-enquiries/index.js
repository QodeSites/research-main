import React, { useEffect, useState } from "react";
import { Container, Table, Spinner, Alert, Button, Form } from "react-bootstrap";

const DataViewer = () => {
  const [activeView, setActiveView] = useState("inquiries");
  const [inquiries, setInquiries] = useState([]);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); // State for search

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch client inquiries
        const inquiriesResponse = await fetch("/api/websiteEnquiries");
        const inquiriesData = await inquiriesResponse.json();

        // Fetch newsletter emails
        const emailsResponse = await fetch("/api/newsletterEmails");
        const emailsData = await emailsResponse.json();

        if (inquiriesData.success) {
          setInquiries(inquiriesData.data);
        } else {
          throw new Error(inquiriesData.message || "Failed to fetch inquiries");
        }

        if (emailsData.success) {
          setEmails(emailsData.data);
        } else {
          throw new Error(emailsData.message || "Failed to fetch emails");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtered Emails based on search query
  const filteredEmails = emails.filter((email) =>
    email.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4">
      <h2 className="text-left mb-4">Website Data</h2>

      {/* Toggle Buttons */}
      <div className="mb-3 text-left">
        <Button
          variant={activeView === "inquiries" ? "primary" : "outline-primary"}
          className="me-2"
          onClick={() => setActiveView("inquiries")}
        >
          Client Inquiries
        </Button>
        <Button
          variant={activeView === "emails" ? "primary" : "outline-primary"}
          onClick={() => setActiveView("emails")}
        >
          Newsletter Emails
        </Button>
      </div>

      {/* Error Message */}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Loading Spinner */}
      {loading && (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}

      {/* Inquiries Table */}
      {!loading && !error && activeView === "inquiries" && (
        <>
          {/* Total Inquiries */}
          <p>
            Total Inquiries: <strong>{inquiries.length}</strong>
          </p>

          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>Investment Goal</th>
                <th>Experience</th>
                <th>Preferred Strategy</th>
                <th>Investment Size</th>
                <th>Received Date</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.length > 0 ? (
                inquiries.map((inquiry, index) => (
                  <tr key={inquiry.id}>
                    <td>{index + 1}</td>
                    <td>{inquiry.name}</td>
                    <td>{inquiry.email}</td>
                    <td>{inquiry.phone_number}</td>
                    <td>{inquiry.investment_goal}</td>
                    <td>{inquiry.investment_experience}</td>
                    <td>{inquiry.preferred_strategy}</td>
                    <td>{inquiry.initial_investment_size}</td>
                    <td>{new Date(inquiry.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center">
                    No inquiries found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </>
      )}

      {/* Newsletter Emails Section */}
      {!loading && !error && activeView === "emails" && (
        <>
          {/* Search Input */}
          <Form className="mb-3">
            <Form.Control
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search Emails"
            />
          </Form>

          {/* Total and Filtered Emails */}
          <p>
            Showing <strong>{filteredEmails.length}</strong> out of <strong>{emails.length}</strong> emails
          </p>

          {/* Emails Table */}
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Email</th>
                <th>Subscribed Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmails.length > 0 ? (
                filteredEmails.map((email, index) => (
                  <tr key={email.id}>
                    <td>{index + 1}</td>
                    <td>{email.email}</td>
                    <td>{new Date(email.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center">
                    No subscribers found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </>
      )}
    </div>
  );
};

export default DataViewer;
