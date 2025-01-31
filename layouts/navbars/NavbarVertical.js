"use client";
// import node module libraries
import { Fragment, useContext, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Accordion from "react-bootstrap/Accordion";
import AccordionContext from "react-bootstrap/AccordionContext";
import { useAccordionButton } from "react-bootstrap/AccordionButton";
import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.min.css";

// import react feather icons
import { BarChart, TrendingUp, Clipboard, ChevronDown } from "react-feather";

import {
  Card,
} from "react-bootstrap";

const NavbarVertical = (props) => {
  const [activeMenus, setActiveMenus] = useState([]);

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
          onClick={decoratedOnClick}
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
      <SimpleBar style={{ maxHeight: "100vh" }}>
        <div className="nav-scroller">
          <Link href="/" className="navbar-brand text-3xl playfair-display">
            Qode
          </Link>
        </div>

        {/* Dashboard Menu */}
        <Accordion as="ul" className="navbar-nav flex-column">
          <CustomToggle eventKey="Performance Analysis:" icon={<BarChart size={18} />}>
            Performance Analysis:
          </CustomToggle>

          <Accordion.Collapse eventKey="Performance Analysis:">
            <ul className="nav flex-column ms-3">
              <li className="nav-item mb-3">
                <Link href="/strategy-returns" className="nav-link d-flex align-items-center">
                  Short Term Performance
                </Link>
              </li>
              <li className="nav-item mb-3">
                <Link href="/returns-comparison" className="nav-link d-flex align-items-center">
                  Long Term Performance
                </Link>
              </li>
              <li className="nav-item mb-3">
                <Link href="/strategy-drawdowns" className="nav-link d-flex align-items-center">
                  Drawdown Comparison
                </Link>
              </li>
            </ul>
          </Accordion.Collapse>

          <Card bsPrefix="nav-item">
            <Link href="/portfolio-visualiser" className="nav-link">
              <Clipboard className="feather-icon" size={18} />&nbsp;
              Portfolio Visualiser
            </Link>
          </Card>

          <Card bsPrefix="nav-item">
            <Link href="/client-tracker" className="nav-link">
              <Clipboard className="feather-icon" size={18} />&nbsp;
              Client Tracker
            </Link>
          </Card>

          <Card bsPrefix="nav-item">
            <Link href="/website-enquiries" className="nav-link">
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

export default NavbarVertical;
