// import node module libraries
import { Fragment } from "react";
import Link from "next/link";
import {
  Accordion,
  Card,
} from "react-bootstrap";

// import react feather icons
import { BarChart, TrendingUp,Clipboard } from "react-feather";

// import simple bar scrolling used for notification item scrolling
import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.min.css";

const NavbarVertical = (props) => {
  return (
    <Fragment>
      <SimpleBar style={{ maxHeight: "100vh" }}>
        <div className="nav-scroller">
          <Link href="/" className="navbar-brand text-3xl playfair-display">
            Qode
          </Link>
        </div>

        {/* Dashboard Menu */}
        <Accordion defaultActiveKey="0" as="ul" className="navbar-nav flex-column">
          <Card bsPrefix="nav-item">
            <Link href="/strategy-drawdowns" className="nav-link">
              <BarChart className="feather-icon" size={18} /> &nbsp;
              Indices Drawdowns
            </Link>
          </Card>
          
          <Card bsPrefix="nav-item">
            <Link href="/strategy-returns" className="nav-link">
               <TrendingUp className="feather-icon" size={18} />&nbsp;
              Indices Returns
            </Link>
          </Card>

          <Card bsPrefix="nav-item">
            <Link href="/portfolio-visualiser" className="nav-link">
               <Clipboard className="feather-icon" size={18} />&nbsp;
              Portfolio Visualiser
            </Link>
          </Card>
        </Accordion>
        {/* end of Dashboard Menu */}
      </SimpleBar>
    </Fragment>
  );
};

export default NavbarVertical;
