// import node module libraries
import Link from 'next/link';
import { Fragment } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Row, Col, Image, Dropdown, ListGroup } from 'react-bootstrap';
import { useRouter } from 'next/router'; // Import useRouter

// simple bar scrolling used for notification item scrolling
import SimpleBar from 'simplebar-react';
import 'simplebar/dist/simplebar.min.css';

// import data files
import NotificationList from 'data/Notification';

// import hooks
import useMounted from 'hooks/useMounted';

const QuickMenu = () => {
  const hasMounted = useMounted();

  const isDesktop = useMediaQuery({
    query: '(min-width: 1224px)',
  });

  const router = useRouter(); // Initialize router

  // Logout handler
  const handleLogout = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // After logout, redirect the user (for example, to the login page)
        router.push('/login');
      } else {
        console.error('Failed to log out');
      }
    } catch (error) {
      console.error('An error occurred during logout:', error);
    }
  };

  const Notifications = () => {
    return (
      <SimpleBar style={{ maxHeight: '300px' }}>
        <ListGroup variant="flush">
          {NotificationList.map((item, index) => {
            return (
              <ListGroup.Item
                className={index === 0 ? 'bg-light' : ''}
                key={index}
              >
                <Row>
                  <Col>
                    <Link href="#" className="text-muted">
                      <h5 className="mb-1">{item.sender}</h5>
                      <p className="mb-0">{item.message}</p>
                    </Link>
                  </Col>
                </Row>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      </SimpleBar>
    );
  };

  const QuickMenuDesktop = () => {
    return (
      <ListGroup
        as="ul"
        bsPrefix="navbar-nav"
        className="navbar-right-wrap ms-auto d-flex nav-top-wrap"
      >
        {/* You can uncomment the notification dropdown if needed */}
        {/*
        <Dropdown as="li" className="stopevent">
          <Dropdown.Toggle
            as="a"
            bsPrefix=" "
            id="dropdownNotification"
            className="btn btn-light btn-icon rounded-circle indicator indicator-primary text-muted"
          >
            <i className="fe fe-bell"></i>
          </Dropdown.Toggle>
          <Dropdown.Menu
            className="dashboard-dropdown notifications-dropdown dropdown-menu-lg dropdown-menu-end py-0"
            aria-labelledby="dropdownNotification"
            align="end"
            show
          >
            <Dropdown.Item className="mt-3" bsPrefix=" " as="div">
              <div className="border-bottom px-3 pt-0 pb-3 d-flex justify-content-between align-items-end">
                <span className="h4 mb-0">Notifications</span>
                <Link href="/" className="text-muted">
                  <span className="align-middle">
                    <i className="fe fe-settings me-1"></i>
                  </span>
                </Link>
              </div>
              <Notifications />
              <div className="border-top px-3 pt-3 pb-3">
                <Link
                  href="/dashboard/notification-history"
                  className="text-link fw-semi-bold"
                >
                  See all Notifications
                </Link>
              </div>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        */}
        <Dropdown as="li" className="ms-2">
          <Dropdown.Toggle as="a" bsPrefix=" " className="rounded-circle" id="dropdownUser">
            <div className="avatar avatar-md avatar-indicators avatar-online">
              <Image
                alt="avatar"
                src="https://www.qodeinvest.com/Q.png"
                className="rounded-circle"
              />
            </div>
          </Dropdown.Toggle>
          <Dropdown.Menu
            className="dropdown-menu dropdown-menu-end"
            align="end"
            aria-labelledby="dropdownUser"
            show
          >
            <Dropdown.Item onClick={handleLogout}>
              <i className="fe fe-power me-2"></i>Sign Out
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </ListGroup>
    );
  };

  const QuickMenuMobile = () => {
    return (
      <ListGroup
        as="ul"
        bsPrefix="navbar-nav"
        className="navbar-right-wrap ms-auto d-flex nav-top-wrap"
      >
        <Dropdown as="li" className="stopevent">
          <Dropdown.Toggle
            as="a"
            bsPrefix=" "
            id="dropdownNotification"
            className="btn btn-light btn-icon rounded-circle indicator indicator-primary text-muted"
          >
            <i className="fe fe-bell"></i>
          </Dropdown.Toggle>
          <Dropdown.Menu
            className="dashboard-dropdown notifications-dropdown dropdown-menu-lg dropdown-menu-end py-0"
            aria-labelledby="dropdownNotification"
            align="end"
          >
            <Dropdown.Item className="mt-3" bsPrefix=" " as="div">
              <div className="border-bottom px-3 pt-0 pb-3 d-flex justify-content-between align-items-end">
                <span className="h4 mb-0">Notifications</span>
                <Link href="/" className="text-muted">
                  <span className="align-middle">
                    <i className="fe fe-settings me-1"></i>
                  </span>
                </Link>
              </div>
              <Notifications />
              <div className="border-top px-3 pt-3 pb-3">
                <Link
                  href="/dashboard/notification-history"
                  className="text-link fw-semi-bold"
                >
                  See all Notifications
                </Link>
              </div>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <Dropdown as="li" className="ms-2">
          <Dropdown.Toggle as="a" bsPrefix=" " className="rounded-circle" id="dropdownUser">
            <div className="avatar avatar-md avatar-indicators avatar-online">
              <Image
                alt="avatar"
                src="https://www.qodeinvest.com/Q.png"
                className="rounded-circle"
              />
            </div>
          </Dropdown.Toggle>
          <Dropdown.Menu
            className="dropdown-menu dropdown-menu-end"
            align="end"
            aria-labelledby="dropdownUser"
          >
            <Dropdown.Item onClick={handleLogout}>
              <i className="fe fe-power me-2"></i>Sign Out
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </ListGroup>
    );
  };

  return (
    <Fragment>
      {hasMounted && isDesktop ? <QuickMenuDesktop /> : <QuickMenuMobile />}
    </Fragment>
  );
};

export default QuickMenu;
