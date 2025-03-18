import React, { useEffect, useState } from "react";
import { Container, Table, Spinner, Alert, Button, Form } from "react-bootstrap";
import { parse } from 'cookie';

const DataViewer = () => {
  const [activeView, setActiveView] = useState("inquiries");
  const [inquiries, setInquiries] = useState([]);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); // For newsletter emails

  // This state object will hold temporary update values keyed by inquiry id
  const [updateStates, setUpdateStates] = useState({});

  // Fetch inquiries and emails on component mount
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

  // Handlers for dropdown and textarea changes per inquiry row
  const handleStatusChange = (id, status) => {
    setUpdateStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], status }
    }));
  };

  const handleCommentsChange = (id, comments) => {
    setUpdateStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], additionalComments: comments }
    }));
  };

  const handleUpdate = async (id) => {
    const { status = "yet to contact", additionalComments = "" } = updateStates[id] || {};

    try {
      const response = await fetch("/api/updateInquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id, status, additionalComments })
      });

      const data = await response.json();
      if (data.success) {
        alert("Inquiry updated successfully");

        // Re-fetch the inquiries to update the UI with the latest data
        const inquiriesResponse = await fetch("/api/websiteEnquiries");
        const inquiriesData = await inquiriesResponse.json();
        if (inquiriesData.success) {
          setInquiries(inquiriesData.data);
        }
      } else {
        alert("Error updating inquiry");
      }
    } catch (error) {
      console.error("Error updating inquiry:", error);
      alert("Error updating inquiry");
    }
  };

  // Function to determine row background color based on status
  const getRowStyle = (inquiry) => {
    // Get the current status, either from the updateStates or from the inquiry itself
    const currentStatus = updateStates[inquiry.id]?.status || inquiry.status || "yet to contact";

    switch (currentStatus) {
      case "dummy":
        return { backgroundColor: "#ffdddd" }; // Subtle red
      case "Contacted":
        return { backgroundColor: "#ffffdd" }; // Subtle yellow
      case "yet to contact":
        return { backgroundColor: "#ddffdd" }; // Subtle green
      default:
        return {};
    }
  };

  // Filtered emails for the newsletter view
  const filteredEmails = emails.filter((email) =>
    email.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container fluid className="p-4">
      <h2 className="text-left mb-4">Website Data</h2>

      {/* Toggle Buttons */}
      <div className="mb-3 text-left">
        <Button
          variant={activeView === "inquiries" ? "primary" : "outline-primary"}
          className="me-2"
          onClick={() => setActiveView("inquiries")}
        >
          Website Inquiries
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
          <p>
            Total Inquiries: <strong>{inquiries.length}</strong>
          </p>

          {/* Color Legend */}
          <div className="mb-3 d-flex gap-3">
            <div className="d-flex align-items-center">
              <div style={{ width: '20px', height: '20px', backgroundColor: '#ffdddd', marginRight: '5px' }}></div>
              <span>Dummy</span>
            </div>
            <div className="d-flex align-items-center">
              <div style={{ width: '20px', height: '20px', backgroundColor: '#ffffdd', marginRight: '5px' }}></div>
              <span>Contacted</span>
            </div>
            <div className="d-flex align-items-center">
              <div style={{ width: '20px', height: '20px', backgroundColor: '#ddffdd', marginRight: '5px' }}></div>
              <span>Yet to Contact</span>
            </div>
          </div>

          {/* Full width table without horizontal scroll wrapper */}
          <div className="table-responsive w-100">
            <Table bordered hover className="w-100 table-layout-fixed">
              <thead>
                <tr>
                  <th style={{ width: '3%' }}>#</th>
                  <th style={{ width: '8%' }}>Name</th>
                  <th style={{ width: '10%' }}>Email</th>
                  <th style={{ width: '8%' }}>Phone Number</th>
                  <th style={{ width: '10%' }}>Investment Goal</th>
                  <th style={{ width: '8%' }}>Experience</th>
                  <th style={{ width: '10%' }}>Preferred Strategy</th>
                  <th style={{ width: '8%' }}>Investment Size</th>
                  <th style={{ width: '10%' }}>Received Date</th>
                  <th style={{ width: '10%' }}>Updated Date</th>
                  <th style={{ width: '15%' }}>Update Status</th>
                </tr>
              </thead>

              <tbody>
                {inquiries.length > 0 ? (
                  inquiries.map((inquiry, index) => (
                    <tr key={inquiry.id}>
                      <td style={getRowStyle(inquiry)}>{index + 1}</td>
                      <td style={getRowStyle(inquiry)}>{inquiry.name}</td>
                      <td style={getRowStyle(inquiry)}>{inquiry.email}</td>
                      <td style={getRowStyle(inquiry)}>{inquiry.phone_number}</td>
                      <td style={getRowStyle(inquiry)}>{inquiry.investment_goal}</td>
                      <td style={getRowStyle(inquiry)}>{inquiry.investment_experience}</td>
                      <td style={getRowStyle(inquiry)}>{inquiry.preferred_strategy}</td>
                      <td style={getRowStyle(inquiry)}>{inquiry.initial_investment_size}</td>
                      <td style={getRowStyle(inquiry)}>
                        {new Date(inquiry.createdAt).toLocaleString()}
                      </td>
                      <td style={getRowStyle(inquiry)}>
                        {inquiry.updatedAt
                          ? new Date(inquiry.updatedAt).toLocaleString()
                          : "Not updated"}
                      </td>
                      <td style={getRowStyle(inquiry)}>
                        <Form.Group controlId={`statusSelect-${inquiry.id}`} className="mb-2">
                          <Form.Select
                            value={
                              updateStates[inquiry.id]?.status ||
                              inquiry.status ||
                              "yet to contact"
                            }
                            onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                          >
                            <option value="Contacted">Contacted</option>
                            <option value="dummy">dummy</option>
                            <option value="yet to contact">yet to contact</option>
                          </Form.Select>
                        </Form.Group>

                        <Form.Group controlId={`comments-${inquiry.id}`} className="mb-2">
                          <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Add comments..."
                            value={
                              updateStates[inquiry.id]?.additionalComments ||
                              inquiry.additionalComments ||
                              ""
                            }
                            onChange={(e) => handleCommentsChange(inquiry.id, e.target.value)}
                          />
                        </Form.Group>

                        <Button variant="secondary" size="sm" onClick={() => handleUpdate(inquiry.id)}>
                          Update
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="text-center">
                      No inquiries found.
                    </td>
                  </tr>
                )}
              </tbody>

            </Table>
          </div>
        </>
      )}

      {/* Newsletter Emails Section */}
      {!loading && !error && activeView === "emails" && (
        <>
          <Form className="mb-3">
            <Form.Control
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search Emails"
            />
          </Form>

          <p>
            Showing <strong>{filteredEmails.length}</strong> out of <strong>{emails.length}</strong> emails
          </p>

          {/* Full width emails table */}
          <div className="table-responsive w-100">
            <Table bordered hover className="w-100">
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>#</th>
                  <th style={{ width: '65%' }}>Email</th>
                  <th style={{ width: '30%' }}>Subscribed Date</th>
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
          </div>
        </>
      )}
    </Container>
  );
};

// Server-side protection: Check for the "auth" cookie and redirect if missing
export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = req.headers.cookie || '';
  const parsedCookies = parse(cookies);

  if (!parsedCookies.auth) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return { props: {} };
}

export default DataViewer;