// import node module libraries
import { useState } from 'react';

// import sub components
import NavbarVertical from './navbars/NavbarVertical';
import NavbarTop from './navbars/NavbarTop';
import { Row, Col } from 'react-bootstrap';
import { parse } from 'cookie';

const DefaultDashboardLayout = ({ children, isLoggedIn }) => {
  const [showMenu, setShowMenu] = useState(false);
  const ToggleMenu = () => setShowMenu(!showMenu);

  // If the user is not logged in, hide the layout and show only the children.
  if (!isLoggedIn) {
    return <>{children}</>;
  }

  return (
    <div id="db-wrapper" className={`${showMenu ? '' : 'toggled'}`}>
      <div className="navbar-vertical navbar ">
        <NavbarVertical
          showMenu={showMenu}
          onClick={(value) => setShowMenu(value)}
        />
      </div>
      <div id="page-content">
        <div className="header">
          <NavbarTop
            data={{
              showMenu: showMenu,
              SidebarToggleMenu: ToggleMenu,
            }}
          />
        </div>
        {children}
        {/*
        <div className='px-6 border-top py-3'>
          <Row>
            <Col sm={6} className='text-center text-sm-start mb-2 mb-sm-0'>
              <p className='m-0'>
                Made by <a href='https://codescandy.com/' target='_blank'>Codescandy</a>
              </p>
            </Col>
            <Col sm={6} className='text-center text-sm-end'>
              <p className='m-0'>
                Destributed by <a href='https://themewagon.com/' target='_blank'>ThemeWagon</a>
              </p>
            </Col>
          </Row>
        </div>
        */}
      </div>
    </div>
  );
};

// Instead of redirecting if the user is not logged in,
// pass a prop to indicate whether the user is logged in.
export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = req.headers.cookie || '';
  const parsedCookies = parse(cookies);
  const isLoggedIn = Boolean(parsedCookies.auth);

  return { props: { isLoggedIn } };
}

export default DefaultDashboardLayout;
