import {Col, Container,OverlayTrigger,Row,Table, Tooltip } from "react-bootstrap";
import { useParams } from "react-router-dom"
import { useEffect, useState } from "react";



import Spinner from 'react-bootstrap/Spinner';
import Image from 'react-bootstrap/Image';
import React from "react";

type Asset = {
  master_address: string;
  name: string;
  symbol: string;
  image_url: string;
  decimal: number;
  }
  
  type ddAsset = {
  type: string;
  address: string | undefined;
  };
  
  type OutputItem = {
  pool: string;
  assetIn: ddAsset;
  assetOut: ddAsset;
  amountIn: string;
  amountOut: string;
  lt: string;
  createdAt: string;
  };
  
  type Transaction = {
  type: string;
  token_jm: string;
  token: number;
  TON: number;
  swap_timestamp: number;
  exchange_name: string;
  };
  
  type AdapterResult = {
  assets: Asset[];
  txes: Transaction[];
  }
  
  //For stonfi response
  
  type sfResponse = {
  operations: {
  operation: Operation;
  asset0_info: AssetInfo;
  asset1_info: AssetInfo;
  }[];
  }
  
  type Operation = {
    pool_tx_hash: string;
      pool_address: string;
      router_address: string;
      pool_tx_lt: number;
      pool_tx_timestamp: string;
      destination_wallet_address: string;
      operation_type: string;
      success: boolean,
      exit_code: string;
      asset0_address: string;
      asset0_amount: string;
      asset0_delta: string;
      asset0_reserve: string;
      asset1_address: string;
      asset1_amount: string;
      asset1_delta: string;
      asset1_reserve: string;
      lp_token_delta: string;
      lp_token_supply: string;
      fee_asset_address: string;
      lp_fee_amount: string;
      protocol_fee_amount: string;
      referral_fee_amount: string;
      referral_address: string  | undefined;
      wallet_address: string;
      wallet_tx_lt: string;
      wallet_tx_hash: string;
      wallet_tx_timestamp: string;
  }
  
  type AssetInfo = {
    contract_address: string;
    "symbol": string;
    display_name: string;
    image_url: string;
    decimals: number;
    kind: string;
    deprecated: boolean;
    community: boolean;
    blacklisted: boolean;
    default_symbol: boolean;
  }
  
  //type AssetArr = AssetInfo[];
  
  type TokenPNL ={
    realised_profit: number;
    roi: string;
    token_info: Asset;
    txes: Transaction[];
  }
  
  type Result = {
    addr_str: string;
    total_pnl: number;
    details: TokenPNL[];
  }
  


  
  //async function dedustAssets(): Promise {
  async function dedustAssets(): Promise<Asset[]> {
    const response = await fetch('https://api.dedust.io/v2/assets');
    const data = await response.json();
    const ddAssetTempList: Asset[] = [];
  
    for (const item of data) {
    if (item.type === 'jetton') {
    const ddAssetTempDict: Asset = {
    master_address: item.address,
    name: item.name,
    symbol: item.symbol,
    image_url: item.image,
    decimal: item.decimals
    };
    ddAssetTempList.push(ddAssetTempDict);
    }
    }
  
  return ddAssetTempList;
  }
  
  function findDdAsset(masterAddr: string, ddAssetsList: Asset[]): Asset | null {
  return ddAssetsList.find(item => item.master_address === masterAddr) || null;
  }
  
  function getDate(timestamp: number): Date {
    return new Date(timestamp * 1000);
  }


  //async function dedustAdapter(addrStr: string): Promise {
  async function dedustAdapter(addrStr: string): Promise<AdapterResult> {
  const responsedd = await fetch(`https://api.dedust.io/v2/accounts/${addrStr}/trades`); //Cors error
  //const responsedd = await fetch(`http://api.dedust.io/v2/accounts/${addrStr}/trades`,{ mode: 'no-cors'});
  console.log(responsedd);
  const datadd = await responsedd.json() as OutputItem[];
  const ddAssetsList = await dedustAssets() as Asset[];
  const notUniqueAssets: Asset[] = [];
  const ddTxesList: Transaction[] = [];
  
  for (const item of datadd) {
  if (item.assetIn.type === "native") {
  const tempDdAsset = findDdAsset(item.assetOut.address!, ddAssetsList);
  if (tempDdAsset !== null) {
  const tempDdTx = {
  type: 'BUY',
  token_jm: item.assetOut.address!,
  token: Number(item.amountOut) / (10 ** tempDdAsset.decimal),
  TON: Number(item.amountIn) / (10 ** 9),
  swap_timestamp: Math.round(new Date(item.createdAt).getTime() / 1000),
  exchange_name: 'dedust.io'
  };
  ddTxesList.push(tempDdTx);
  notUniqueAssets.push(tempDdAsset);
  }
  }
  }
  
  for (const item of datadd) {
  if (item.assetOut.type === "native") {
  const tempDdAsset = findDdAsset(item.assetIn.address!, ddAssetsList);
  if (tempDdAsset !== null) {
  const tempDdTx = {
  type: 'SELL',
  token_jm: item.assetIn.address!,
  token: Number(item.amountIn) / (10 ** tempDdAsset.decimal),
  TON: Number(item.amountOut) / (10 ** 9),
  swap_timestamp: Math.round(new Date(item.createdAt).getTime() / 1000),
  exchange_name: 'dedust.io'
  };
  ddTxesList.push(tempDdTx);
  notUniqueAssets.push(tempDdAsset);
  }
  }
  }
  
  const ddUniqueAssets = Object.values(notUniqueAssets.reduce((acc, cur) => Object.assign(acc, { [cur.master_address]: cur }), {})) as Asset[];
  
  return { assets: ddUniqueAssets, txes: ddTxesList };
  
  }
  
    // for time
    

  
  async function stonfiAdapter(addrStr: string): Promise<AdapterResult>{ 
  const payload = { since: '2021-01-01T12:34:56', until: '2050-11-02T23:59:59', op_type: 'Swap' };
  const queryParams = new URLSearchParams(payload).toString();
  const url = `https://api.ston.fi/v1/wallets/${addrStr}/operations?${queryParams}`;
  const sfresponse = await fetch(url);
  const sfData = await sfresponse.json() as sfResponse;
  const sfNotUniqueAssets: Asset[] = [];
  const sfTxesList: Transaction[] = [];
  
  for (const row of sfData['operations']) {
  
  const tempSFTx = {} as Transaction;
  
  if (row['operation']['asset1_address'] === 'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez') {
    if (row['operation']['fee_asset_address'] === "EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez") {
    tempSFTx["type"] = "SELL";
    } else {
    tempSFTx["type"] = "BUY";
    }
    tempSFTx["token_jm"] = row['operation']['asset0_address'];
    tempSFTx["token"] = Math.abs(parseInt(row['operation']['asset0_amount'])) / 10**row['asset0_info']['decimals'];
    tempSFTx["TON"] = Math.abs(parseInt(row['operation']['asset1_amount'])) / 10**row['asset1_info']['decimals'];
    tempSFTx["swap_timestamp"] = Math.floor(new Date(row['operation']['wallet_tx_timestamp']).getTime() / 1000);
    tempSFTx["exchange_name"] = 'ston.fi';
    sfTxesList.push(tempSFTx);
  
    const sfAssetTempDict = {
    "master_address": row['asset0_info']['contract_address'],
    "name": row['asset0_info']['display_name'],
    "symbol": row['asset0_info']['symbol'],
    "image_url": row['asset0_info']['image_url'],
    "decimal": row['asset0_info']['decimals']
    };
    sfNotUniqueAssets.push(sfAssetTempDict);
  
  }
  
  
  if (row['operation']['asset0_address'] === 'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez') {
    if (row['operation']['fee_asset_address'] === "EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez") {
    tempSFTx["type"] = "SELL";
    } else {
    tempSFTx["type"] = "BUY";
    }
    tempSFTx["token_jm"] = row["operation"]["asset1_address"];
  
    tempSFTx["token"] = Math.abs(parseInt(row['operation']['asset1_amount'])) / Math.pow(10, row['asset1_info']['decimals']);
    tempSFTx["TON"] = Math.abs(parseInt(row['operation']['asset0_amount'])) / Math.pow(10, row['asset0_info']['decimals']);
    tempSFTx["swap_timestamp"] = Math.floor(new Date(row['operation']['wallet_tx_timestamp']).getTime() / 1000);
    tempSFTx["exchange_name"] = 'ston.fi';
    sfTxesList.push(tempSFTx);
    const sf_asset_temp_dict = {
    "master_address": row['asset1_info']['contract_address'],
    "name": row['asset1_info']['display_name'],
    "symbol": row['asset1_info']['symbol'],
    "image_url": row['asset1_info']['image_url'],
    "decimal": row['asset1_info']['decimals']
    };
    sfNotUniqueAssets.push(sf_asset_temp_dict);
  }
  
  }
  
  const sfUniqueAssets = Object.values(sfNotUniqueAssets.reduce((acc, cur) => Object.assign(acc, { [cur.master_address]: cur }), {})) as Asset[];
  
  return { assets: sfUniqueAssets, txes: sfTxesList };
  }
  
  function searchAllTxes(searchAddr: string, txesArr: Transaction[]): Transaction[] {
    return txesArr.filter((t) => t.token_jm === searchAddr);
  }




    
    
    export const countPnL = async(addr_str: string) => {
        try {
          const take_dd = await dedustAdapter(addr_str);
          const take_sf = await stonfiAdapter(addr_str);
          
          const txes_arr: Transaction[] = [];
        
          for (const tx1 of take_dd['txes']) {
          txes_arr.push(tx1);
          }
          for (const tx2 of take_sf['txes']) {
          txes_arr.push(tx2);
          }
        
          const user_not_unique_assets: Asset[] = [];
          for (const asset1 of take_dd['assets']) {
          user_not_unique_assets.push(asset1);
          }
          for (const asset2 of take_sf['assets']) {
          user_not_unique_assets.push(asset2);
          }
          
          
          const user_unique_assets = Object.values(user_not_unique_assets.reduce((acc, cur) => Object.assign(acc, { [cur.master_address]: cur }), {})) as Asset[];
          
          let details: TokenPNL[] = [];
        
          for (const jetton of user_unique_assets) {
            const temp_txes = searchAllTxes(jetton.master_address, txes_arr).sort((a, b) => a.swap_timestamp - b.swap_timestamp);
            let sum_sell = 0;
            let sum_buy = 0;
        
            for (const swap of temp_txes) {
            if (swap.type === 'SELL') {
            sum_sell += swap.TON;
            } else if (swap.type === 'BUY') {
            sum_buy += swap.TON;
            }
            }
        
            const Realised_profit = sum_sell - sum_buy;
            const roi = sum_buy > 0 ? ((Realised_profit / sum_buy) * 100).toFixed(2) : "0";
        
            const tt_details_dict = {
            realised_profit: Realised_profit,
            roi: roi,
            token_info: jetton,
            txes: temp_txes
            };
        
            details.push(tt_details_dict);
          }
          
          
          const frontJson = {} as Result;
          frontJson['addr_str'] = addr_str;
          let totalPnl = 0;
          for (const item of details) {
            totalPnl = totalPnl + item['realised_profit'];
          }
          frontJson['total_pnl'] = totalPnl;
          frontJson['details'] = details;
          
          return frontJson;
            
        }
        catch (e: any) { 
            console.log(e);
        }
    }

const SinglePnL = () => {
    const {addr} = useParams();
    //console.log(useParams());  <h2 className="text-white">{addr}</h2>
    const [data, setData] = useState<Result | undefined>(undefined);
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
          if (addr !== undefined) {
                // Code to be executed if the variable is not undefined
                const data = await countPnL(addr);
                setData(data);
                // switch loading to false after fetch is complete
            }
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
  
    const tooltip = (
      <Tooltip id="tooltip">
        Click to show txes.
      </Tooltip>
    );


    var tableRows;
    var visible_addr;
    var tonscan_link;

    var total_realised_pnl;
    //var total_roi;




    if(data.details.length === 0){
      return (
        <div className="vh-100 bg-dark">
            <Container fluid className="py-4 text-center" data-bs-theme="dark">
            <h1 style={{ fontSize: "30px", fontWeight: "175"  }} className="text-white">No swap transactions were found for this account, if you are sure otherwise, write in the comments <a href="https://t.me/ton_learn">here</a>.</h1>
            <p className="text-secondary">At the moment we are only looking for Stonfi</p>
          </Container>
          </div>
      );
    } else {
        // test EQDESqGp5eZH6uMku68uc_q35GC-xwCtqUqWrcWASVP8d6Ke
        // header
        //addr_str: string; - кнопка скопировать
        //total_pnl: number; 
        //realised_profit: number; разные Цвета в зависимости от плюса или минуса
        //roi: number;
        // Учтенные биржи -Stonefi
        //console.log(data);
        visible_addr = data.addr_str.substring(0,4)+"..."+data.addr_str.substring(data.addr_str.length - 5,data.addr_str.length)
        //<a href={"https://tonscan.org/address/"+row.address_friendly} target="_blank" rel="noopener noreferrer"> </a>
        tonscan_link = <a href={"https://tonscan.org/address/"+data.addr_str} target="_blank" rel="noopener noreferrer"> {visible_addr} </a>
        total_realised_pnl = <h3 style={{color: data.total_pnl > 0 ? "#15a272" : "#e53843"}}>{data.total_pnl.toFixed(2)}</h3>
        //total_roi = <p className="text-white">Total Roi {data.roi.toFixed(2)} %</p>
        //<Row xs="auto">
        //<Col>{total_realised_pnl}</Col>
        //<Col>{total_roi}</Col>
        //</Row> 
        // Token list colSpan={12}
        // collapsible txes https://codepen.io/n3k1t/pen/OJMGgyq
        tableRows = data.details.map((row: TokenPNL) => {
          var txMap = row.txes.map((tx_row: Transaction) => {
            return (
              <tr>
                <td>{tx_row.type}</td>
                <td>{tx_row.token.toFixed(2)}</td>
                <td>{tx_row.TON.toFixed(2)}</td>
                <td>{getDate(tx_row.swap_timestamp).toUTCString()}</td>
                <td>{tx_row.exchange_name}</td>
              </tr>
            );
          });
            return (
                <React.Fragment>
            <OverlayTrigger placement="top" overlay={tooltip}>
              <tr onClick={onClickHandler}>
                <td><div><Image src={row.token_info.image_url} roundedCircle width={35} height={35} /> {row.token_info.name ? row.token_info.name : (row.token_info.master_address.substring(0,4)+"..."+row.token_info.master_address.substring(row.token_info.master_address.length - 5,row.token_info.master_address.length))}</div></td>
                <td style={{color: row.realised_profit > 0 ? "#15a272" : "#e53843"}} >{row.realised_profit.toFixed(2)} TON</td>
                <td>{row.roi} </td>
                
                <td>{row.txes.length} &#9432;</td>
                
             </tr>
             </OverlayTrigger>
             <tr className="collapse">
                <td colSpan={12}>
                <Table striped bordered hover variant="dark"> 
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>TON Amount</th>
                    <th>Age</th>
                    <th>Exchange</th>
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
    }



    return (
      <div className="bg-dark">
      <Container>
      <br/>
      <Row xs="auto">
        <Col><h2 className="text-white">Address</h2></Col>
        <Col><h2 className="text-white">{tonscan_link}</h2></Col>
      </Row> 
      
      </Container>

      <Container>
      <Row xs="auto">
        <Col><h3 className="text-white">Total PnL </h3></Col>
        <Col>{total_realised_pnl}</Col>
        <Col><h3 className="text-white"> TON</h3></Col>
      </Row> 
      <p className="text-secondary">Accounted Exchanges: Dedust.io and Ston.fi. You can start trading in TON <a style={{ textDecoration: 'none' }} href="https://t.me/xrocket?start=i_tonlearn" target="_blank" rel="noopener noreferrer">here</a></p>
      <p className="text-secondary">Read about Realised PnL <a style={{ textDecoration: 'none' }} href="https://t.me/ton_learn/" target="_blank" rel="noopener noreferrer">here</a></p>
     
      </Container>


      <div className="vh-100 bg-dark">
        <Container>
      <Table striped bordered hover variant="dark">
    <thead>
        <tr>
          <th>Traded Token</th>
          <th>Realised Profit</th>
          <th>ROI</th>
		      <th>Transactions</th>
        </tr>
      </thead>
      <tbody>
      {tableRows}
      </tbody>
        </Table>
        </Container>
        </div>
      </div>
    )
  
    }
  
  
  export default SinglePnL;