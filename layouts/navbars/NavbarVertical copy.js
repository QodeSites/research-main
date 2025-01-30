"use client";
import { Fragment, useContext, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Accordion from "react-bootstrap/Accordion";
import AccordionContext from "react-bootstrap/AccordionContext";
import { useAccordionButton } from "react-bootstrap/AccordionButton";
import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.min.css";

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
              {children}
            </div>
            <ChevronDown 
              size={16} 
              className={`transform transition-transform ${isCurrentEventKey ? 'rotate-180' : ''}`}
            />
          </div>
        </Link>
      </li>
    );
  };

  return (
    <Fragment>
      <SimpleBar style={{ maxHeight: "100vh" }}>
        <div className="nav-scroller">
          <Link href="/" className="navbar-brand">
            <img
              src="/assets/density_logo_new_trans.png"
              alt="Logo"
              className="img-fluid"
              style={{ height: "80px", width: "auto" }}
            />
          </Link>
        </div>
        <Accordion as="ul" className="navbar-nav flex-column">
          {/* Dashboard Accordion */}
          <CustomToggle eventKey="Performance Analysis:" >
          Performance Analysis:
          </CustomToggle>
          <Accordion.Collapse eventKey="Performance Analysis:">
            <ul className="nav flex-column ms-3">
              <li className="nav-item mb-3">
                <Link href="/" className="nav-link d-flex align-items-center">
                  All
                </Link>
              </li>
              <li className="nav-item mb-3">
                <Link href="/dashboard/customer" className="nav-link d-flex align-items-center">
                 Customer
                </Link>
              </li>
              <li className="nav-item mb-3">
                <Link href="/dashboard/sales-person" className="nav-link d-flex align-items-center">
                 Sales Person
                </Link>
              </li>
            </ul>
          </Accordion.Collapse>

          {/* Quotations */}
          <li className="nav-item mb-3">
            <Link href="/quotations" className="nav-link d-flex align-items-center">
               Quotation
            </Link>
          </li>

          {/* Orders Accordion */}
          <CustomToggle eventKey="orders" >
            Orders
          </CustomToggle>
          <Accordion.Collapse eventKey="orders">
            <ul className="nav flex-column ms-3">
              <li className="nav-item mb-3">
                <Link href="/orders" className="nav-link d-flex align-items-center">
                </Link>
              </li>
              <li className="nav-item mb-3">
                <Link href="/open-orders" className="nav-link d-flex align-items-center">
                </Link>
              </li>
            </ul>
          </Accordion.Collapse>

          {/* Invoices */}
          <li className="nav-item mb-3">
            <Link href="/invoices" className="nav-link d-flex align-items-center">
            </Link>
          </li>

          {/* Customers (Admin Only) */}
            <li className="nav-item mb-3">
              <Link href="/customers" className="nav-link d-flex align-items-center">
               Customers
              </Link>
            </li>

          {/* Products */}
          <li className="nav-item mb-3">
            <Link href="/products" className="nav-link d-flex align-items-center">
               Products
            </Link>
          </li>

          {/* Outstanding Payments */}
          <li className="nav-item mb-3">
            <Link href="/outstanding-payment" className="nav-link d-flex align-items-center">
               Outstanding Payments
            </Link>
          </li>


        </Accordion>
      </SimpleBar>
    </Fragment>
  );
};

export default NavbarVertical;