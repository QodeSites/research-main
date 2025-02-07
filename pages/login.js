// pages/login.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Form,
  Button,
  Alert,
  Row,
  Col
} from 'react-bootstrap';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();

    // Send credentials to the login API
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      // Redirect on successful login
      router.push('/');
    } else {
      // Display error message from API response
      const data = await res.json();
      setError(data.message);
    }
  }

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <Row
        className="w-100 shadow"
        style={{ maxWidth: '900px', borderRadius: '10px', overflow: 'hidden' }}
      >
        {/* Login Form Section */}
        <Col
          md={6}
          className="d-flex flex-column justify-content-center p-5"
          style={{ backgroundColor: '#ffffff' }}
        >
          <h1 className="mb-4 text-center">Login</h1>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="username" className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="password" className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>

            <div className="d-grid">
              <Button variant="primary" type="submit">
                Login
              </Button>
            </div>
          </Form>
        </Col>

        {/* Image/Quote Section */}
        <Col
          md={6}
          className="d-none d-md-flex align-items-center justify-content-center"
          style={{
            background: 'url(https://images.unsplash.com/photo-1606189934846-a527add8a77b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8d2VhbHRoJTIwbWFuYWdlbWVudHxlbnwwfHwwfHx8MA%3D%3D)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div
            className="text-white p-4 text-center"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              borderRadius: '10px'
            }}
          >
            <p className="lead">
              "Invest in your dreams, invest in your future. True wealth is built
              on wise decisions."
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
