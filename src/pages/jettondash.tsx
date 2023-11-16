
import { useEffect, useState } from "react";
import { request, gql } from 'graphql-request'

//import { Address } from 'ton-core';
import { Container, OverlayTrigger, Table, Tooltip } from "react-bootstrap";
import Spinner from 'react-bootstrap/Spinner';

import jsonData from './jetton_list.json';
import React from "react";

type TokenDict = {
  address: string;
  total_supply: number;
  name: string;
  symbol: string;
  };
  
  // for txes response
  
  interface TxesObject {
      [x: string]: TxesArray;
  }
  
  interface TxesArray extends Array<TxesValue> { }
  
  type TxesValue = {
    segment: string;
    cnt: number;
  }
  
  //txes dict counted
  
  interface TxesDict {
  [key: string]: {
  txes_24_hours: number;
  txes_7_days: number;
  txes_30_days: number;
  };
  }
  
  //for top w response
  
  
  interface ValueItem {
    address: string;
    parsed_jetton_wallet_owner_address_address: string;
    parsed_jetton_wallet_balance: number;
  }
  
  interface ResponseTopData {
  data: {
  [key: string]: ValueItem[];
  };
  }
  
  interface TopWDict {
  [key: string]: {
  owner: string;
  balance: number;
  }[];
  }
  
  // For result 
  interface TokenInfo {
  jm_address: string;
  total_supply: number;
  name: string;
  symbol: string;
  txes_24_hours: number;
  txes_7_days: number;
  txes_30_days: number;
  distribution: {
  owner: string;
  balance: number;
  fraction: number;
  }[];
  }

  interface Tx {
    owner: string;
    balance: number;
    fraction: number;
  }


async function fetchData() {
  try {
		const endpoint = 'https://dton.io/graphql/'
		// GQL top accs
		//var tokenData = jsonData as TokenDict[];
		//const jsonString = fs.readFileSync('./jetton_list.json', 'utf-8');
		//const jsonData = JSON.parse(jsonString) as TokenDict[];
		
		/**/
		jsonData.forEach((coin: TokenDict) => {
			console.log('Name: ' + coin.name);
			console.log('Symbol: ' + coin.symbol);
			console.log('Total Supply: ' + coin.total_supply);
			console.log('Address: ' + coin.address);
		});
	
		// Take Txes
		
		let queryStr=""
		for (const token of jsonData) {
			let addr_cut = token["address"].slice(2)
			let addr_dop = '"' + token.address.slice(2) + '"'
			queryStr+= `
			    seq${addr_cut}: lastTransactionCountSegments(
				  in_msg_op_code: 395134233
				  segmentation: "day"
				  days: 30
				  parsed_jetton_wallet_jetton_address_address: ${addr_dop}
				) {
				  segment
				  cnt
				}
			` +`\n`
		}
		
		const query = gql`query {`+queryStr+`}`
		const responseCnt = await request(endpoint, query) as TxesObject

		const txesDict: TxesDict = {};
		for (const [segments, value] of Object.entries(responseCnt)) {
			const ttDict: { txes_24_hours: number; txes_7_days: number; txes_30_days: number } = {
				txes_24_hours: value[0].cnt,
				txes_7_days: value.slice(0, 7).reduce((sum, ittr) => sum + ittr.cnt, 0),
				txes_30_days: value.reduce((sum, ittr) => sum + ittr.cnt, 0)
			};

			txesDict["0:" + segments.slice(3)] = ttDict;
		}

		console.log(txesDict);
		
		
		//Take Top Wallets
		let formattedQueryTop: string = "";

		for (const token of jsonData) {
			let approved: string = "parsed_jetton_wallet_data_is_approved: 1";
			if (token.address === "0:9DA73E90849B43B66DACF7E92B576CA0978E4FC25F8A249095D7E5EB3FE5EEBB") {
				approved = "";
			}
			
			const template: string = `
			seq${token.address.slice(2)}: account_states(
			account_state_state_init_code_has_get_wallet_data: 1
			${approved}
			parsed_jetton_wallet_jetton_address_address: "${token.address.slice(2)}"
			workchain: 0
			order_by: "parsed_jetton_wallet_balance"
			order_desc: true
			page_size: 20
			) {
			address
			parsed_jetton_wallet_balance
			parsed_jetton_wallet_owner_address_address
			}
			`;

			const formatted: string = template + "\n";
			formattedQueryTop += formatted;
		
		}
		const queryTop = gql`query {`+formattedQueryTop+`}`
		const responseTop = await request(endpoint, queryTop) as ResponseTopData
		
		
		const topWDict: TopWDict = {};

		for (const [segments, value] of Object.entries(responseTop)) {
			const resList: { owner: string; balance: number }[] = [];

			for (const jw of value) {
				const tDict: { owner: string; balance: number } = {
				owner: `0:${jw.parsed_jetton_wallet_owner_address_address}`,
				balance: jw.parsed_jetton_wallet_balance,
			};
			resList.push(tDict);
			}

			topWDict[`0:${segments.slice(3)}`] = resList;
		}
		
		const result: TokenInfo[] = [];

		for (const row of jsonData) {
		const res_dict: TokenInfo = {
		jm_address: row['address'],
		total_supply: row['total_supply'],
		name: row['name'],
		symbol: row['symbol'],
		txes_24_hours: txesDict[row['address']]['txes_24_hours'],
		txes_7_days: txesDict[row['address']]['txes_7_days'],
		txes_30_days: txesDict[row['address']]['txes_30_days'],
		distribution: []
		};

		for (const i of topWDict[row['address']]) {
		const frac_t = {
		owner: i['owner'],
		balance: i['balance'],
		fraction: Math.round( (i['balance'] / row['total_supply'])*100000 ) /100000
		};
		res_dict.distribution.push(frac_t);
		}

		result.push(res_dict);
		}
		

		const sorted_list = result.slice().sort((a, b) => b.txes_30_days - a.txes_30_days);
		
    return sorted_list
	}
	catch (e: any) { 
		console.log(e)
		console.log(e.message);
	}   
}




const JettonDashboard = () => {
    //const [data, setData] = useState<any | null>(null);
    const [data, setData] = useState<TokenInfo[] | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    
    const onClickHandler = (e: { currentTarget: { nextSibling: any; }; }) => {
      const hiddenElement = e.currentTarget.nextSibling;
      hiddenElement.className.indexOf("collapse show") > -1 ? hiddenElement.classList.remove("show") : hiddenElement.classList.add("show");
    };
  


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
  

    const renderTooltip = (props: any) => (
      <Tooltip id="button-tooltip" {...props}>
        Click to expand
      </Tooltip>
    );

    //console.log(loading);
    // return a Spinner when loading is true
    if(loading) return (
      <>
      <div className="vh-100 bg-dark">
          <Container fluid className="py-4 text-center" data-bs-theme="dark">
          <p style={{ fontSize: "30px", fontWeight: "190"  }} className="text-white">Loading data...</p>
          <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="text-secondary">Tonlearn.tools is a live analytical platform - it takes time to collect data!</p>
          <p className="text-secondary">Now I am collecting all the information on the Jettons and will show it to you in 30 sec</p>
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
  
    const tableRows = data.map((row: TokenInfo,index) => {
      var txMap = row.distribution.map((tx_row: Tx) => {
        let visible_addr_part = tx_row.owner.substring(0,4)+"..."+tx_row.owner.substring(tx_row.owner.length - 5,tx_row.owner.length)
        return (
          <tr>
            <td><a style={{ textDecoration: 'none' }} href={'https://tonscan.org/address/'+tx_row.owner} target="_blank" rel="noopener noreferrer">{visible_addr_part}</a></td>
            <td>{(tx_row.fraction*100).toFixed(3)}</td>
          </tr>
        );
      });


      return (
        <React.Fragment>
        <tr  onClick={onClickHandler}>
        <td>{index+1}</td>
        <td>{row.name}</td>
        <td>{row.txes_30_days}</td>
        <td>{row.txes_7_days}</td>
        <td>{row.txes_24_hours}</td>
        <td><OverlayTrigger
      placement="right"
      delay={{ show: 250, hide: 400 }}
      overlay={renderTooltip}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-info-circle" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
    </svg>
    </OverlayTrigger></td>
        <td><a style={{ textDecoration: 'none' }} href="https://t.me/xrocket?start=i_tonlearn" target="_blank" rel="noopener noreferrer">Buy Jetton here</a></td>
       </tr>
  
       <tr className="collapse">
                <td colSpan={12}>
                <Table striped bordered hover variant="dark"> 
                <thead>
                  <tr>
                    <th>Owner Addr</th>
                    <th>Percent from total supply,%</th>
                  </tr>
                </thead>
                <tbody>
                {txMap}
                </tbody>
                
                </Table>
                </td>
             </tr>

       </React.Fragment>  
      );
    });
  
    return (
      <div className="bg-dark">
      <Container>
      <h2 className="text-white">Jettons Ranking </h2>
      <p className="text-secondary">Jetton ranked by 30 days txes count with distribution, Click on token to see top 20 jetton holders</p>
      <p className="text-secondary">How to read this dashboard <a style={{ textDecoration: 'none' }} href="https://t.me/ton_learn/" target="_blank" rel="noopener noreferrer">here</a></p>
      <Table striped bordered hover variant="dark">
      <thead>
          <tr>
            <th>#</th>
            <th>Jetton</th>
            <th>30 days Txes</th>
            <th>7 days Txes</th>
            <th>Today Txes</th>
            <th>Distribution</th>
            <th>Buy</th>
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
  
  
  export default JettonDashboard ;