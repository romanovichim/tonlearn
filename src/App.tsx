import './App.css'
import { Container, Nav, Navbar} from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css';
import { Routes, Route, Outlet, Link } from "react-router-dom";


// Pages
import NftSalesVolume from './pages/nftvolume'
import TonCoinWhales from './pages/tonwhales'

function App() {


  return (
    <>

    <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="ton-nft-sales-volume" element={<NftSalesVolume />} />
          <Route path="ton-toncoin-whales" element={<TonCoinWhales />} />
          {/* Using path="*"" means "match anything", so this route
                acts like a catch-all for URLs that we don't have explicit
                routes for. */}
          <Route path="*" element={<NoMatch />} />
        </Route>
      </Routes>

    </>

  )
}

function Layout() {
  return (
    <div>
      {/* A "layout route" is a good place to put markup you want to
          share across all the pages on your site, like navigation. 
          <Nav.Link><Link to="/nothing-here" style={{ textDecoration: 'none' }}>Nothing Here</Link></Nav.Link>*/}
      
      <Navbar data-bs-theme="dark" className="bg-body-tertiary">
      <Container>
      <Navbar.Brand href="/">Ton Learn</Navbar.Brand>
          <Nav className="me-auto">
          <Nav.Link><Link to="/ton-nft-sales-volume" style={{ textDecoration: 'none' }}>Nft Sales Volume</Link></Nav.Link>
          <Nav.Link><Link to="/ton-toncoin-whales" style={{ textDecoration: 'none' }}>Toncoin Whales</Link></Nav.Link>
          </Nav>
      </Container>
    </Navbar>

      {/* An <Outlet> renders whatever child route is currently active,
          so you can think about this <Outlet> as a placeholder for
          the child routes we defined above. */}
      <Outlet />
    </div>
  );
}

function Home() {
  return (
    <div className="vh-100 bg-dark">
    <Container fluid className="py-4 text-center" data-bs-theme="dark">
  <p style={{ fontSize: "30px", fontWeight: "190"  }} className="text-white">Discover TON Insights You Can't Get Anywhere Else</p>
  <br /> 
  <p style={{ fontSize: "20px", fontWeight: "190"  }} className="text-white"> Unlock the next level with blockchain analytics. More <a href="https://t.me/ton_learn">here</a></p>
  </Container>
</div>
  );
}

function NoMatch() {
  return (
    <div className="vh-100 bg-dark">
    <Container fluid className="py-4 text-center" data-bs-theme="dark">
  <h1 style={{ fontSize: "30px", fontWeight: "175"  }} className="text-white">This is a 404 page, go to our home page or our <a href="https://t.me/ton_learn">community</a></h1>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
  </Container>
  </div>
  
  );
}



export default App
