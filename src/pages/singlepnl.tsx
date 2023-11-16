import {Col, Container,OverlayTrigger,Row,Table, Tooltip } from "react-bootstrap";
import { useParams } from "react-router-dom"
import { useEffect, useState } from "react";



import Spinner from 'react-bootstrap/Spinner';
import Image from 'react-bootstrap/Image';
import React from "react";

type ApiResponse = {
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
    
    type AssetArr = AssetInfo[];
    
    type Tx =  {
        "type": string;
        token: number;
        TON: number;
        wallet_tx_timestamp: string;
        hash: string;
    }
    
    type ResItem = {
        token_info: AssetInfo;
        txes: Tx[];
        realised_profit: number;
        roi: number;
    }
    
    type ResultArr = ResItem[];
    
    
    type frontRes = {
        addr_str: string;
        total_pnl: number;
        details: ResultArr; 
        realised_profit: number;
        roi: number;
    }
    
    
    export const countPnL = async(addr_str: string) => {
        try {
            const payload = {
            since: '2021-01-01T12:34:56',
            until: '2050-11-02T23:59:59',
            op_type: 'Swap',
            };
    
            const url = new URL(`https://api.ston.fi/v1/wallets/${addr_str}/operations`);
            Object.entries(payload).forEach(([key, value]) => {
            url.searchParams.append(key, value);
            });
            
            const response = await fetch(url.toString(), {
              method: 'GET',
              headers: {
                Accept: 'application/json',
              },
            });
            
            if (!response.ok) {
              //throw new Error(`Error! status: ${response.status}`);
              //добавить отправку пустого значения
              console.log(`Error! status: ${response.status}`);
              return undefined;
            }
            
            const responseData = (await response.json() as ApiResponse);
    
            if (responseData.operations.length < 1) {
                return 'empty';
            }
    
            //console.log(responseData);
            
            var temp_arr=[] as AssetArr;
            
            for (const row of responseData.operations) {
                if (row.operation.exit_code === 'swap_ok') {
                    if (
                    row.asset1_info.contract_address === 'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez' ||
                    row.asset0_info.contract_address === 'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez'
                    ) {
                        if (
                        row.asset0_info.contract_address !== 'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez' &&
                        !temp_arr.includes(row.asset0_info)
                        ) {
                        temp_arr.push(row.asset0_info);
                        }
                        if (
                        row.asset1_info.contract_address !== 'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez' &&
                        !temp_arr.includes(row.asset1_info)
                        ) {
                        temp_arr.push(row.asset1_info);
                        }
                    }
                }
            }
            
            //console.log(temp_arr);
            //let outputArray = Array.from(new Set(temp_arr)) as AssetArr;
            //console.log(outputArray);
            //find distnct
            const distinctObjects = Array.from(new Set(temp_arr.map(obj => JSON.stringify(obj))))
            .map(jsonString => JSON.parse(jsonString)) as AssetArr;
    
            var result_arr=[] as ResultArr;
            
            //console.log(distinctObjects);
            for (const token of distinctObjects) {
                var res_dict = {} as ResItem;
    
                res_dict["token_info"] = token;
    
                var temp_arr2 = [] as Tx[];
    
                for (const row of responseData.operations) {
                    if (
                    (row.asset1_info.contract_address === 'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez' && row.asset0_info.contract_address === token.contract_address)
                    || (row.asset0_info.contract_address === 'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez' && row.asset1_info.contract_address === token.contract_address)
                    ) {
                    var temp = {} as Tx;
    
                    if (row.operation.fee_asset_address === token.contract_address) {
                        temp["type"] = "BUY";
                    } else {
                        temp["type"] = "SELL";
                    }
    
                    // Other properties and operations for temp object
                    if (row.asset0_info.contract_address === 'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez') {
                    temp["TON"] = Math.abs(parseInt(row.operation.asset0_amount)) / Math.pow(10, row.asset0_info.decimals);
                    } else {
                    temp["token"] = Math.abs(parseInt(row.operation.asset0_amount)) / Math.pow(10, row.asset0_info.decimals);
                    }
    
                    if (row.asset1_info.contract_address === 'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez') {
                    temp["TON"] = Math.abs(parseInt(row.operation.asset1_amount)) / Math.pow(10, row.asset1_info.decimals);
                    } else {
                    temp["token"] = Math.abs(parseInt(row.operation.asset1_amount)) / Math.pow(10, row.asset1_info.decimals);
                    }
        
                    temp['wallet_tx_timestamp'] = row.operation.wallet_tx_timestamp;
                    temp["hash"] = `https://tonscan.org/tx/${row.operation.wallet_tx_hash}`;
    
                    //
                    temp_arr2.push(temp);
                    }
                }
                res_dict["txes"] = temp_arr2;
    
                // Calculation
                let sum_sell = 0;
                for (const swap of temp_arr2) {
                    if (swap.type === 'SELL') {
                        sum_sell += swap.TON;
                    }
                }
    
                let sum_buy = 0;
                for (const swap of temp_arr2) {
                    if (swap.type === 'BUY') {
                        sum_buy += swap.TON;
                    }
                }
    
                const Realised_profit = sum_sell - sum_buy;
                res_dict["realised_profit"] = Realised_profit;
    
                let roi = 0;
                if (sum_buy > 0) {
                    roi = Math.round((Realised_profit / sum_buy) * 100 * 100) / 100;
                }
                res_dict["roi"] = roi;
    
                result_arr.push(res_dict);
                
            }
            //console.log(result_arr)
            
            var front_json = {} as frontRes;
            front_json['addr_str'] = addr_str;
    
            let total_pnl = 0;
            for (const item of result_arr) {
                total_pnl += item['realised_profit'];
            }
    
            front_json['total_pnl'] = total_pnl;
            front_json['details'] = result_arr;
            
            //console.log(front_json);
            return front_json;
            
        }
        catch (e: any) { 
            console.log(e.message);
        }
    }

const SinglePnL = () => {
    const {addr} = useParams();
    //console.log(useParams());  <h2 className="text-white">{addr}</h2>
    const [data, setData] = useState<frontRes | undefined | 'empty'>(undefined);
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




    if(data === 'empty'){
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
        console.log(data);
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
        tableRows = data.details.map((row: ResItem) => {
          var txMap = row.txes.map((tx_row: Tx) => {
            return (
              <tr>
                <td>{tx_row.type}</td>
                <td>{tx_row.token.toFixed(2)}</td>
                <td>{tx_row.TON.toFixed(2)}</td>
                <td>{tx_row.wallet_tx_timestamp}</td>
                <td><a style={{ textDecoration: 'none' }} href={tx_row.hash} target="_blank" rel="noopener noreferrer">link</a></td>
              </tr>
            );
          });
            return (
                <React.Fragment>
            <OverlayTrigger placement="top" overlay={tooltip}>
              <tr onClick={onClickHandler}>
                <td><div><Image src={row.token_info.image_url} roundedCircle width={35} height={35} /> {row.token_info.display_name ? row.token_info.display_name : (row.token_info.contract_address.substring(0,4)+"..."+row.token_info.contract_address.substring(row.token_info.contract_address.length - 5,row.token_info.contract_address.length))}</div></td>
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
                    <th>Age, utc</th>
                    <th>Tx</th>
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
        <Col><h3 className="text-white">Total PnL</h3></Col>
        <Col>{total_realised_pnl}</Col>
        <Col><h3 className="text-white"> TON</h3></Col>
      </Row> 
      <p className="text-secondary">Accounted Exchanges: Ston.fi</p>
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