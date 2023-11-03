
import './App.css'
import { Container, Nav, Navbar} from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css';
import { Routes, Route, Outlet, Link, useNavigate } from "react-router-dom";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

// Pages
import NftSalesVolume from './pages/nftvolume'
import TonCoinWhales from './pages/tonwhales'
import WhaleDuRove  from './pages/w_durove'
//PnL Page
import SinglePnL from './pages/singlepnl'

function App() {


  return (
    <>

    <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="pnl/:addr" element={<SinglePnL />} />
          <Route path="ton-nft-sales-volume" element={<NftSalesVolume />} />
          <Route path="ton-toncoin-whales" element={<TonCoinWhales />} />
          <Route path="pavel-durov-telegram-usernames" element={<WhaleDuRove />} />
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
          <Nav.Link><Link to="/pavel-durov-telegram-usernames" style={{ textDecoration: 'none' }}>Durov Usernames</Link></Nav.Link>
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
  const navigate = useNavigate();

  const handleSubmit = (event: { preventDefault: () => void; }) => {
    event.preventDefault();
    //console.log(event.target.pnl.value);
    // 👇️ redirect to
    const input = document.getElementById('pnl_input') as HTMLInputElement | null;
    console.log(input?.value);
    //console.log(input?.value);
    //add all the input filters here
    if (input != null && input?.value !='') {
      navigate('/pnl/'+input?.value); // 👉️ pnl
    }
    
    //<form onSubmit={handleSubmit}>
    //<input id="pnl_input" />
    //<button type="submit">Submit</button>
    //</form>
    // https://tonlearn.tools/#/pnl/EQDESqGp5eZH6uMku68uc_q35GC-xwCtqUqWrcWASVP8d6Ke
    // https://tonlearn.tools/#/pnl/EQAxQzpBXpgLaf_wk0sjPkUSmECjCzD3f7U1EAAMqw_v1xEx
    // https://tonlearn.tools/#/pnl/EQD18dhkAGmKGJiWYPlIz0ltokUrE6ysXPzEKgxszxvqsy6R

  };


  return (
    <div className="vh-100 bg-dark">
    <Container fluid className="py-4 text-center" data-bs-theme="dark">
    <br />
  <p style={{ fontSize: "30px", fontWeight: "600"  }} className="text-white">TON PnL Analyzer</p>
  <p style={{ fontSize: "25px", fontWeight: "190"  }} className="text-white"> Use our Address Analyzer to quickly visualize the PnL (profit and loss)<br />and Trading History of your wallet address!</p>
  <br /> 
  <p className="text-secondary">Integrated over StoneFi for now!</p>
  <Form onSubmit={handleSubmit}>
    <Form.Group>
      <Form.Control style={{width:"50%"}} id="pnl_input" className='mx-auto' placeholder="Example: EQDESqGp5eZH6uMku68uc_q35GC-xwCtqUqWrcWASVP8d6Ke"/>
      <Form.Text className="text-muted">
            Enter a wallet address in a friendly from. Ex: <span><a href="https://tonlearn.tools/#/pnl/EQDESqGp5eZH6uMku68uc_q35GC-xwCtqUqWrcWASVP8d6Ke" target="_blank" rel="noopener noreferrer">EQDE...d6Ke</a></span> <span><a href="https://tonlearn.tools/#/pnl/EQAxQzpBXpgLaf_wk0sjPkUSmECjCzD3f7U1EAAMqw_v1xEx" target="_blank" rel="noopener noreferrer">EQAx...1xEx</a></span> <span><a href="https://tonlearn.tools/#/pnl/EQD18dhkAGmKGJiWYPlIz0ltokUrE6ysXPzEKgxszxvqsy6R" target="_blank" rel="noopener noreferrer">EQD1...sy6R </a></span>
      </Form.Text>
    </Form.Group>
    <br/>
    <Button variant="primary"  type="submit">Submit Address</Button>
  </Form> 
  </Container>

  <Container fluid className="py-4 text-center" data-bs-theme="dark">
  <p style={{ fontSize: "25px", fontWeight: "190"  }} className="text-white">Discover TON Insights You Can't Get Anywhere Else</p>
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
