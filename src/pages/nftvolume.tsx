
import { useEffect, useState } from "react";
import { request, gql } from 'graphql-request'
//import * as fs from 'fs';

import jsonDataImages from './nft_col_images.json';
import jsonDataNames from './nft_col_names.json';

import { Address } from 'ton-core';
import { Container, Table } from "react-bootstrap";
import Spinner from 'react-bootstrap/Spinner';
import Image from 'react-bootstrap/Image';

export interface RespSales {
	lastTransactionCountSegments: OneCnt[];
}

type OneCnt = {
	cnt: number;
	segment: string  | undefined;
}

/*
type JSONValue =
    | string
    | number
    | boolean
    | JSONObject
    | JSONArray;

*/
type JSONValue = JSONObject;


interface JSONObject {
    [x: string]: JSONValue;
}

//interface JSONArray extends Array<JSONValue> { }

interface SalesObject {
    [x: string]: SalesArray;
}

interface SalesArray extends Array<SalesValue> { }

type SalesValue = {
      collection: string;
      price: string ;
      nft: string  | undefined;
      block_time: string  | undefined;
	  new_owner: string;
	  prev_owner: string;
}
    
type OneRank = {
	col_addr_hex: string;
	sum_price: string;
	txes_sale: number;
}

type rankArr = OneRank[];

type OneRich = {
	col_addr_hex: string;
	sum_price: string;
	txes_sale: number;
	col_name: string  | undefined;
	col_image: string  | undefined;
}

type richArr = OneRich[];

async function fetchData() {
	const endpoint = 'https://dton.io/graphql/'
	// cut account_state_state_init_code_has_get_sale_data: 1 + noise but less sales cut
	const query_day_sales = gql`
	query {
		lastTransactionCountSegments(
			segmentation: "hour"

			parsed_seller_is_closed: 1
			page_size: 24
		) { cnt segment}
	}
	`
	const data = await request(endpoint, query_day_sales) as RespSales


	let daySalesNum = data.lastTransactionCountSegments.reduce((n, {cnt}) => n + cnt, 0) as number;
	
	const page_size = 100

	const needed_queries = ~~(daySalesNum/page_size) + 1
	console.log(needed_queries)
	
	
	
	let queryStr=""
	for (let page = 0; page < needed_queries; page++) {
	  queryStr+= `q${page}: transactions( parsed_seller_is_closed: 1 workchain: 0 page_size: ${page_size} page: ${page}) { collection: parsed_seller_nft_collection_address_address price: parsed_seller_nft_price nft: parsed_seller_nft_address_address block_time:gen_utime new_owner: parsed_seller_nft_new_owner_address_address prev_owner: parsed_seller_nft_prev_owner_address_address}` +`\n`
	}
	
	const query = gql`query {`+queryStr+`}`
	
	const data_txes = await request(endpoint, query) as SalesObject
	//var keyCount  = Object.keys(data_txes).length;
	//console.log(keyCount)
	//console.log(data_txes)
	// collect data to convinient array
	
	var sales_arr=[];
	
	for (let key in data_txes) {
    let values = data_txes[key];
	//console.log(value.length)
    //console.log(value)
		for (let index in values) {
			if (values[index].collection != null) {
				// Убираем wash trade
				if(values[index].new_owner != values[index].prev_owner && values[index].new_owner != null && values[index].prev_owner != null) { 
					sales_arr.push(values[index]);
				}
			}
		
			
			//console.log(values[index].collection)
			//sales_arr.push(values[index])
		}
	
	}
	
	console.log("Sales Count",sales_arr.length)
	// Преобразовываем данные
	//for (let i in sales_arr) {
	//	console.log(sales_arr[i].collection)
	//}
	const groupedKeys = sales_arr.reduce((group: {[key: string]: SalesArray}, item) => {
	 if (!group[item.collection]) {
	  group[item.collection] = [];
	 }
	 group[item.collection].push(item);
	 return group;
	}, {});
		
	//console.log(groupedKeys.length)
	var rank_arr=[] as rankArr;
	
	for (let key in groupedKeys) {
		let batch = groupedKeys[key];
		//console.log(key)
		//console.log(batch.length)
		let sum: number = 0;
		batch.forEach(a => sum += Number(a.price));
		//console.log((sum/1000000000).toFixed(2));
		rank_arr.push({col_addr_hex:key,sum_price:(sum/1000000000).toFixed(2),txes_sale: batch.length} as OneRank);
    // Use `key` and `value`
	}
		
	//console.log(rank_arr.length)	
	//https://dev.to/ankittanna/how-to-create-a-type-for-complex-json-object-in-typescript-d81
	rank_arr.sort((a, b) => Number(b.sum_price) - Number(a.sum_price));	
	console.log(rank_arr.length)
	//Open Jsons and enrich data
	
	//const jsonStringImages = fs.readFileSync('./nft_col_images.json', 'utf-8');
  //  const jsonDataImages = JSON.parse(jsonStringImages);

	//const jsonStringNames = fs.readFileSync('./nft_col_names.json', 'utf-8');
  //  const jsonDataNames = JSON.parse(jsonStringNames);

	var rich_arr=[] as richArr;
	for (let row in rank_arr) {
		//console.log(rank_arr[row]['col_addr_hex'])
		let temp_col = rank_arr[row]['col_addr_hex']
		//console.log(jsonDataImages[temp_col]);
		let temp_address = Address.parseRaw('0:'+rank_arr[row]['col_addr_hex']).toString({ urlSafe: true });
		rich_arr.push({col_addr_hex: temp_address,sum_price:rank_arr[row]['sum_price'],txes_sale: rank_arr[row]['txes_sale'],col_name: jsonDataNames[temp_col as keyof typeof jsonDataNames],col_image: jsonDataImages[temp_col as keyof typeof jsonDataImages]} as OneRich);
	}

  return rich_arr;

}

const NftSalesVolume = () => {
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
		<p className="text-secondary">tonlearn - Live Analytics Platform, so wait 20 seconds and the data will appear</p>
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
      <td><a href={"https://tonscan.org/nft/"+row.col_addr_hex} target="_blank" rel="noopener noreferrer"><Image src={row.col_image} roundedCircle width={35} height={35} /> {row.col_name ? row.col_name  : (row.col_addr_hex.substring(0,4)+"..."+row.col_addr_hex.substring(row.col_addr_hex.length - 5,row.col_addr_hex.length))}</a></td>
      <td>{row.sum_price} TON</td>
	  <td>{row.txes_sale}</td>
     </tr>

      
    );
  });

  return (
    <div className="bg-dark">
	<Container>
	<h2 className="text-white">TON NFT Collection Rankings by 24 hours Sales Volume</h2>
	<p className="text-secondary">Important: sales may include wash trade transactions, <a style={{ textDecoration: 'none' }} href="https://t.me/ton_learn/43" target="_blank" rel="noopener noreferrer">more on this</a>.</p>
    <Table striped bordered hover variant="dark">
    <thead>
        <tr>
          <th>#</th>
          <th>Collection</th>
          <th>Sales Volume</th>
		  <th>Transactions</th>
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


export default NftSalesVolume;