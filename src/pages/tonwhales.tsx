
import { useEffect, useState } from "react";
import { request, gql } from 'graphql-request'

import { Address } from 'ton-core';
import { Container, Table } from "react-bootstrap";
import Spinner from 'react-bootstrap/Spinner';


type Account = {
    address: string;
    image: string | undefined;
    name: string;
    require_memo: boolean | undefined;
  };
  
  
  type OneState = {
      balance: string;
      address: string;
  }
  
  type stateArr = OneState[];
  
  type statePrep ={
      account_states: stateArr;
  }
  
  
  type OneRich = {
      address_friendly: string;
      balance: string;
      name: string  | undefined;
  }
  
  type richArr = OneRich[];


// Fixed-> toStrin,then separations  
function numberWithCommas(x: Number) {
    var parts = x.toFixed(2).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

async function fetchData() {
    const endpoint = 'https://dton.io/graphql/'
    // GQL top accs
    const query_hundred = gql`
      {
        account_states(
          order_by: "account_storage_balance_grams"
          order_desc: true
          workchain: 0
          page_size: 100
        ){
          balance: account_storage_balance_grams
          address
        }
      }
    `
    const data = await request(endpoint, query_hundred) as statePrep
    //console.log(data.account_states)
    //for (var row of data.account_states) {
    //	 console.log(row.balance)
    //}
    
    
    // access tonkeeper address
    const response = await fetch('https://raw.githubusercontent.com/tonkeeper/ton-assets/main/accounts.json', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error! status: ${response.status}`);
    }

    // 👇️ const result: GetUsersResponse
    const acc_list = (await response.json()) as Account[];
    //for (var acc of acc_list) {
    //	 console.log(acc.address)
    //}

    // enrich
    var rich_arr=[] as richArr;
    //for (let row in data.account_states) {
        //console.log(rank_arr[row]['col_addr_hex'])
        //let temp_col = rank_arr[row]['col_addr_hex']
        //console.log(jsonDataImages[temp_col]);
        //let temp_address = Address.parseRaw('0:'+rank_arr[row]['col_addr_hex']).toString({ urlSafe: false });
        //console.log(row.address);
    //}
    for (var row of data.account_states) {
        //friendly address
        let temp_name = undefined as string  | undefined; 
        let temp_addr =  Address.parseRaw('0:'+row.address).toString({ urlSafe: false });
        for (var acc of acc_list) {
            if('0:'+row.address.toLowerCase() === acc.address){
                temp_name = acc.name
                //console.log(acc.name);
            } 
        }
        rich_arr.push({address_friendly: temp_addr,balance: row.balance,name: temp_name} as OneRich);
    }

    return rich_arr
}




const TonCoinWhales = () => {
    //const [data, setData] = useState<any | null>(null);
    const [data, setData] = useState<richArr | undefined>(undefined);
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
          const data = await fetchData();
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
    // when data is available, title is shown
    //return (
    //  <h1>NFT Volume be here</h1>
    //);s
    //<><p>{row.col_addr_hex}</p></>
  
    const tableRows = data.map((row: OneRich,index) => {
      return (
        <tr>
        <td>{index+1}</td>
        <td><a href={"https://tonscan.org/address/"+row.address_friendly} target="_blank" rel="noopener noreferrer"> {row.name ? row.name  : (row.address_friendly.substring(0,4)+"..."+row.address_friendly.substring(row.address_friendly.length - 5,row.address_friendly.length))}</a></td>
        <td>{numberWithCommas(Number(row.balance)/1000000000)} TON</td>
       </tr>
  
        
      );
    });
  
    return (
      <div className="bg-dark">
      <Container>
      <h2 className="text-white">Top Accounts by TON Balance </h2>
      <p className="text-secondary">Richest TON accounts by balance</p>
      <Table striped bordered hover variant="dark">
      <thead>
          <tr>
            <th>#</th>
            <th>Whale</th>
            <th>TON Balance</th>
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
  
  
  export default TonCoinWhales;