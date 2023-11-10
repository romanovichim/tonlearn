
import { useEffect, useState } from "react";

import { Badge, Button, Container, Dropdown, Stack, Table } from "react-bootstrap";
import Spinner from 'react-bootstrap/Spinner';
import type { frontRes  } from "../pnl/pnldashboardscript.tsx";

import { dashboardPnL } from "../pnl/pnldashboardscript.tsx";

async function fetchData() {
    return dashboardPnL(7);
}


const PnLDashSeven = () => {
    //console.log(useParams());  <h2 className="text-white">{addr}</h2>
    const [data, setData] = useState<frontRes[] | undefined >(undefined);
    const [loading, setLoading] = useState(true);

    // useEffect with an empty dependency array works the same way as componentDidMount
    useEffect(() => {
       try {
         // set loading to true before calling API
         setLoading(true);
         //console.log(loading);
         //const data = fetchData() as richArr;
         //setData(data);
         (async () => {
            const data = await fetchData() as frontRes[] | undefined;
            console.log(data);
            setData(data);
            // switch loading to false after fetch is complete
            setLoading(false);
           })();
  
  
         
       } catch (error) {
         // add error handling here
         setLoading(false);
         console.log(error);
       }
    }, []);
  
    //console.log(loading);
    // return a Spinner when loading is true
    if(loading) return (
      <div className="vh-100 bg-dark">
          <Container fluid className="py-4 text-center" data-bs-theme="dark">
          <p style={{ fontSize: "30px", fontWeight: "190"  }} className="text-white">Loading data...</p>
          <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
          
          </Spinner>
          <p className="text-secondary">Tonlearn.tools is a live analytical platform - it takes time to collect data!</p>
        </Container>
      </div>
  
    );
  
    // data will be null when fetch call fails
    if (!data) {
      return (
      <div className="vh-100 bg-dark">
          <Container fluid className="py-4 text-center" data-bs-theme="dark">
          <h1 style={{ fontSize: "30px", fontWeight: "175"  }} className="text-white">An error occurred while loading data, if you want to report it, write in the comments <a href="https://t.me/ton_learn">here</a>.</h1>
        </Container>
        </div>
    );
    }
  
    const tableRows = data.map((row: frontRes,index) => {
        return (
          <tr>
          <td>{index+1}</td>
          <td>{(row.addr_str.substring(0,4)+"..."+row.addr_str.substring(row.addr_str.length - 5,row.addr_str.length))}</td>
          <td>{row.total_pnl.toFixed(2)} TON</td>
          <td>{row.total_txes_count}</td>
          <td> <Button variant="outline-light" size="sm"><a style={{ textDecoration: 'none',color: 'white'}} href={'https://tonlearn.tools/#/pnl/'+row.addr_str} target="_blank" rel="noopener noreferrer">Analyze Address</a></Button></td>
         </tr>
        );
      });

      


    return (
        <div className="bg-dark">
        <Container>
        <Stack direction="horizontal" gap={1}>
        <h2 className="text-white">TON TOP DEX Traders </h2> 
        <Badge pill bg="info">Beta</Badge>
        </Stack>
        <p className="text-secondary">Collects data on Stonfi by time interval! More details <a style={{ textDecoration: 'none' }} href="https://t.me/ton_learn/" target="_blank" rel="noopener noreferrer">here</a></p>
        <p className="text-secondary">Important! The interval greatly influences the result; to view the Result for all transactions, click on Analyze Address</p>
        <Dropdown>
        <Dropdown.Toggle variant="secondary" id="dropdown-basic">
        Time Basis: 7D
        </Dropdown.Toggle>

        <Dropdown.Menu className="bg-dark">
            <Dropdown.Item href="#/ton-best-traders-daily" className="text-white">Time Basis: 1D</Dropdown.Item>
            <Dropdown.Item href="#/ton-best-traders" className="text-white">Time Basis: 30D</Dropdown.Item>
        </Dropdown.Menu>
       </Dropdown>
        <br />
        <Table striped bordered hover variant="dark">
        <thead>
            <tr>
              <th>#</th>
              <th>Address</th>
              <th>Realized Profit</th>
              <th>Total trades for the period</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
          {tableRows}
          </tbody>
        </Table>
        </Container>
        </div>
    )
  
    }
  
  
  export default PnLDashSeven;