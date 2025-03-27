// pages/_app.js
import Head from 'next/head';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import SSRProvider from 'react-bootstrap/SSRProvider';
import { Analytics } from '@vercel/analytics/react';
import '../components/components.css';
import './index.css';
import 'styles/theme.scss';
import 'react-bootstrap-typeahead/css/Typeahead.css';
// import default layouts
import DefaultDashboardLayout from 'layouts/DefaultDashboardLayout';
import App from 'next/app';
import { parse } from 'cookie';
import { useEffect } from 'react';
import io from 'socket.io-client';

function MyApp({ Component, pageProps, isLoggedIn }) {
  useEffect(() => {
    // Initialize socket connection when app loads
    fetch('/api/socket');
    
    // Optional: Set up global socket connection
    const socket = io();
    
    return () => {
      socket.disconnect();
    };
  }, []);
  const router = useRouter();
  const pageURL = process.env.baseURL + router.pathname;
  const title = "Research | Qodeinvest";
  const description =
    "Dash is a fully responsive and yet modern premium Nextjs template & snippets. Geek is feature-rich Nextjs components and beautifully designed pages that help you create the best possible website and web application projects. Nextjs Snippet";
  const keywords =
    "Dash UI, Nextjs, Next.js, Course, Sass, landing, Marketing, admin themes, Nextjs admin, Nextjs dashboard, ui kit, web app, multipurpose";

  // Identify the layout to be used.
  // (Here you can adjust the conditions as needed.)
  const Layout =
    Component.Layout ||
    (router.pathname.includes('dashboard')
      ? // You can add further checks for instructor or student dashboards here.
        DefaultDashboardLayout
      : DefaultDashboardLayout);

  return (
    <SSRProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content={keywords} />
        <link
          rel="shortcut icon"
          href="https://qodeinvest.com/assets/favicon-DUTjpjCl.png"
          type="image/x-icon"
        />
      </Head>
      <NextSeo
        title={title}
        description={description}
        canonical={pageURL}
        openGraph={{
          url: pageURL,
          title: title,
          description: description,
          site_name: process.env.siteName,
        }}
      />
      <Layout isLoggedIn={isLoggedIn}>
        <Component {...pageProps} />
        <Analytics />
      </Layout>
    </SSRProvider>
  );
}

// Use getInitialProps to check authentication on the server.
MyApp.getInitialProps = async (appContext) => {
  // Get initial props from the default App
  const appProps = await App.getInitialProps(appContext);
  let isLoggedIn = false;

  // appContext.ctx.req is only available on the server side.
  if (appContext.ctx.req) {
    const cookies = appContext.ctx.req.headers.cookie || '';
    const parsedCookies = parse(cookies);
    isLoggedIn = !!parsedCookies.auth; // Set to true if the 'auth' cookie exists.
  }

  return { ...appProps, isLoggedIn };
};

export default MyApp;
