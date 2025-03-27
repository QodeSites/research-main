"use client";
// import node module libraries
import { Fragment, useContext, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Accordion from "react-bootstrap/Accordion";
import AccordionContext from "react-bootstrap/AccordionContext";
import { useAccordionButton } from "react-bootstrap/AccordionButton";
import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.min.css";

// import react feather icons
import { BarChart, TrendingUp, Clipboard, ChevronDown } from "react-feather";

import { Card } from "react-bootstrap";
import { parse } from "cookie";

const NavbarVertical = (props) => {
  const [activeMenus, setActiveMenus] = useState([]);
  const navbarRef = useRef(null);

  // Helper to hide sidebar if the function is passed in props.data
  const hideSidebar = () => {
    if (props.data && typeof props.data.SidebarToggleMenu === "function") {
      props.data.SidebarToggleMenu(false);
    }
  };

  // Click-outside handler: if click occurs outside navbar, hide it.
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Use the DOM element directly instead of SimpleBar's ref
      if (
        navbarRef.current &&
        navbarRef.current.container && // Access the container of SimpleBar
        !navbarRef.current.container.contains(event.target)
      ) {
        hideSidebar();
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const CustomToggle = ({ children, eventKey, icon }) => {
    const { activeEventKey } = useContext(AccordionContext);
    const isCurrentEventKey = activeEventKey === eventKey;

    const decoratedOnClick = useAccordionButton(eventKey, () => {
      setActiveMenus((prev) =>
        isCurrentEventKey
          ? prev.filter((key) => key !== eventKey)
          : [...prev, eventKey]
      );
    });

    return (
      <li className="nav-item mb-2">
        <Link
          href="#"
          className={`nav-link ${activeMenus.includes(eventKey) ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            decoratedOnClick();
          }}
          data-bs-toggle="collapse"
          data-bs-target="#navDashboard"
          aria-expanded={isCurrentEventKey}
          aria-controls="navDashboard"
        >
          <div className="d-flex w-full justify-between items-center">
            <div className="d-flex items-center">
              {icon && <span className="me-2">{icon}</span>}
              {children}
            </div>
            {/* Uncomment below if you wish to show a rotating chevron */}
            {/* <ChevronDown
              size={16}
              className={`transform transition-transform ${
                isCurrentEventKey ? "rotate-180" : ""
              }`}
            /> */}
          </div>
        </Link>
      </li>
    );
  };

  return (
    <Fragment>
      <SimpleBar style={{ maxHeight: "100vh" }} ref={navbarRef}>
        <div className="nav-scroller">
          <Link href="/" className="navbar-brand text-3xl playfair-display" onClick={hideSidebar}>
            Qode
          </Link>
        </div>

        {/* Dashboard Menu */}
        <Accordion as="ul" className="navbar-nav flex-column">
          <CustomToggle
            eventKey="Performance Analysis:"
            icon={<BarChart size={18} />}
          >
            Performance Analysis:
          </CustomToggle>

          <Accordion.Collapse eventKey="Performance Analysis:">
            <ul className="nav flex-column ms-3">
              <li className="nav-item mb-3">
                <Link
                  href="/strategy-returns"
                  className="nav-link d-flex align-items-center"
                  onClick={hideSidebar}
                >
                  Short Term Performance
                </Link>
              </li>
              <li className="nav-item mb-3">
                <Link
                  href="/returns-comparison"
                  className="nav-link d-flex align-items-center"
                  onClick={hideSidebar}
                >
                  Long Term Performance
                </Link>
              </li>
              <li className="nav-item mb-3">
                <Link
                  href="/strategy-drawdowns"
                  className="nav-link d-flex align-items-center"
                  onClick={hideSidebar}
                >
                  Drawdown Comparison
                </Link>
              </li>
              <li className="nav-item mb-3">
                <Link
                  href="/monthly-report"
                  className="nav-link d-flex align-items-center"
                  onClick={hideSidebar}
                >
                  Monthly Report
                </Link>
              </li>
            </ul>
          </Accordion.Collapse>

          <Card bsPrefix="nav-item">
            <Link
              href="/portfolio-visualiser"
              className="nav-link"
              onClick={hideSidebar}
            >
              <Clipboard className="feather-icon" size={18} />&nbsp;
              Portfolio Visualiser
            </Link>
          </Card>

          <Card bsPrefix="nav-item">
            <Link
              href="/client-tracker"
              className="nav-link"
              onClick={hideSidebar}
            >
              <Clipboard className="feather-icon" size={18} />&nbsp;
              Client Tracker
            </Link>
          </Card>

          <Card bsPrefix="nav-item">
            <Link
              href="/website-enquiries"
              className="nav-link"
              onClick={hideSidebar}
            >
              <Clipboard className="feather-icon" size={18} />&nbsp;
              Website Enquiries
            </Link>
          </Card>
        </Accordion>
        {/* end of Dashboard Menu */}
      </SimpleBar>
    </Fragment>
  );
};

export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = req.headers.cookie || "";
  const parsedCookies = parse(cookies);

  if (!parsedCookies.auth) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // If the auth cookie exists, render the page
  return { props: {} };
}

export default NavbarVertical;