import { useEffect, useState } from "react";
import { request, gql } from 'graphql-request'

import { Address } from 'ton-core';
import { Container, Table } from "react-bootstrap";
import Spinner from 'react-bootstrap/Spinner';

type OneTx = {
	nft: string;
	price: string;
	block_time: string;
	offchain_url: string;
}

type txesArr = OneTx[];

type txesPrep ={
	transactions: txesArr;
}

function padTo2Digits(num: number) {
  return num.toString().padStart(2, '0');
}

function formatDate(date: Date) {
  return (
    [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join('-') +
    ' ' +
    [
      padTo2Digits(date.getHours()),
      padTo2Digits(date.getMinutes()),
      padTo2Digits(date.getSeconds()),
    ].join(':')
  );
}

type OneRich = {
	nft: string;
	price: string;
	time: string;
	name: string;
}

type richArr = OneRich[];




async function fetchData() {
    const endpoint = 'https://dton.io/graphql/'
    // GQL top accs
    const query_hundred = gql`
      {
        transactions(
        parsed_seller_is_closed: 1
        order_by: "gen_utime"
        order_desc: true
        workchain: 0
        page_size: 150
        page: 0
        parsed_seller_nft_new_owner_address_address: "D8CD999FB2B1B384E6CA254C3883375E23111A8B78C015B886286C31BF11E29D"
        parsed_seller_nft_collection_address_address: "80D78A35F955A14B679FAA887FF4CD5BFC0F43B4A4EEA2A7E6927F3701B273C2"
        ) {
        nft: parsed_seller_nft_address_address
        price: parsed_seller_nft_price
        block_time: gen_utime
        offchain_url: parsed_nft_content_offchain_url
        }
        }
    `
    const data = await request(endpoint, query_hundred) as txesPrep
    var rich_arr=[] as richArr;
    for (var row of data.transactions) {
        let temp_addr =  Address.parseRaw('0:'+row.nft).toString({ urlSafe: true });
        let temp_price = (Number(row.price)/1000000000).toFixed(2);
        let temp_time =  formatDate(new Date(row.block_time))
        let n = row.offchain_url.lastIndexOf('/');
        let temp_name = row.offchain_url.substring(n + 1).slice(0, -5);;
        console.log(temp_addr,temp_price,temp_time,temp_name)
        rich_arr.push({nft: "https://tonscan.org/address/"+temp_addr,price: temp_price,time: temp_time,name: temp_name} as OneRich);
    }		

return rich_arr
}




const WhaleDuRove = () => {
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
      <>
        <Alert key='danger' variant='danger'>
        This product uses dton.io to obtain data. At the moment, dton.io is moving to new servers and therefore the functionality may not work. For now, join the 
          <Alert.Link href="https://t.me/ton_learn"> community</Alert.Link>.
        </Alert>
      <div className="vh-100 bg-dark">
          <Container fluid className="py-4 text-center" data-bs-theme="dark">
          <p style={{ fontSize: "30px", fontWeight: "190"  }} className="text-white">Loading data...</p>
          <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
          </Spinner>
        </Container>
      </div>
      </>
  
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
  
    const tableRows = data.map((row: OneRich) => {
      return (
        <tr>
        <td>{row.time}</td>
        <td><a href={row.nft} target="_blank" rel="noopener noreferrer"> {row.name}</a></td>
        <td>{row.price}</td>
       </tr>
  
        
      );
    });
  
    return (
      <div className="bg-dark">
      <Container>
      <h2 className="text-white">Telegram usernames bought by Pavel Durov</h2>
      <p className="text-secondary">Last 150 purchases tg usernames of Pavel Durov. </p>
      <p className="text-secondary">Important! Sales and transfers have not yet been shown, so it is not a fact that what was purchased now belongs to Pavel.</p>
      <Table striped bordered hover variant="dark">
      <thead>
          <tr>
            <th>Date</th>
            <th>Telegram Username</th>
            <th>Purchase price, TON</th>
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
  
  
  export default WhaleDuRove;