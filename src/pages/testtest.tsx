
import { useEffect, useState } from "react";

//import { Address } from 'ton-core';
import {Container } from "react-bootstrap";
//import { Col, Container, Dropdown, Form, Row, Table } from "react-bootstrap";
import Spinner from 'react-bootstrap/Spinner';
//import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import BootstrapTable from 'react-bootstrap-table-next'; //filters
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

//filter
//import Multiselect from "multiselect-react-dropdown";
import filterFactory, { selectFilter }  from 'react-bootstrap-table2-filter';

type Pool = {
    address: string;
    apy_1d: string;
    apy_30d: string;
    apy_7d: string;
    collected_token0_protocol_fee: string;
    collected_token1_protocol_fee: string;
    deprecated: boolean;
    lp_account_address: string;
    lp_balance: string;
    lp_fee: string;
    lp_price_usd: string;
    lp_total_supply: string;
    lp_total_supply_usd: string;
    lp_wallet_address: string;
    protocol_fee: string;
    protocol_fee_address: string;
    ref_fee: string;
    reserve0: string;
    reserve1: string;
    router_address: string;
    token0_address: string;
    token0_balance: string;
    token1_address: string;
    token1_balance: string;
}

type ApiPoolResponse = {
    pool_list: Pool[];
}

type Asset = {
    balance: string;
    blacklisted: boolean;
    community: boolean;
    contract_address: string;
    decimals: number;
    default_symbol: boolean;
    deprecated: boolean;
    dex_price_usd: string;
    dex_usd_price: string;
    display_name: string;
    image_url: string;
    kind: string; // Assuming "Jetton" may have other values, you can restrict it to a union type if needed
    priority: number;
    symbol: string;
    tags: string[]; // Array of strings
    taxable: boolean;
    third_party_price_usd: string;
    third_party_usd_price: string;
    wallet_address: string;
}

type ApiAssetResponse = {
    asset_list: Asset[];
}

type Reward = {
    address: string;
    amount: string;
}

type NftInfo = {
    address: string;
    create_timestamp: string;
    min_unstake_timestamp: string;
    nonclaimed_rewards: string;
    rewards: Reward[]; // An array of Reward objects
    staked_tokens: string;
    status: string;
}

type Farm = {
    apy: string;
    min_stake_duration_s: string;
    minter_address: string;
    nft_infos: NftInfo[]; // An array of NftInfo objects
    pool_address: string;
    reward_token_address: string;
    status: string;
}

type ApiFarmResponse = {
    farm_list: Farm[]; // An array of Farm objects
}

type EnrichedAsset = {
	token_address: string;
	symbol: string;
	display_name: string;
	image_url: string;
	decimals: number;
	price: number | undefined;
    tags: string[];
    community: boolean;
}

type EnrichedSSPool = {
    pool_address: string;
	dex: string;
	farm_info: string | undefined;
	token0_info: EnrichedAsset | undefined;
	token1_info: EnrichedAsset | undefined; 
	lp_fee: number;
	tvl_usd: number;
	apr_24h: number;
	risk: string;
}


function stonfiSearchFarm(addr: string, farmList: Farm[]): string | undefined {
    for (const element of farmList) {
        if (element.pool_address === addr && element.status === 'operational') {
            return element.apy; // Return the APY if conditions are met
        }
    }
    
    return undefined; // Return null if no matching farm is found
}

function stonfiSearchToken(addr: string, assetList: { contract_address: string, symbol: string, display_name: string, image_url: string, decimals: number,tags: string[],community: boolean }[]): EnrichedAsset | undefined {
    // Handle specific known tokens with their properties directly
    if (addr === "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c") {
        return {
            token_address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
            symbol: 'TON',
            display_name: 'TON',
            image_url: 'https://asset.ston.fi/img/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
            decimals: 9,
            price: undefined,
            tags: [],
            community: false
        };
    }
    
    if (addr === "EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT") {
        return {
            token_address: 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT',
            symbol: 'NOT',
            display_name: 'Notcoin',
            image_url: 'https://asset.ston.fi/img/EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT',
            decimals: 9,
            price: undefined,
            tags: [],
            community: false
        };
    }
    
    if (addr === "EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO") {
        return {
            token_address: 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO',
            symbol: 'STON',
            display_name: 'STON',
            image_url: 'https://asset.ston.fi/img/EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO',
            decimals: 9,
            price: undefined,
            tags: [],
            community: false
        };
    }

    // Iterate through asset list to find matching contract address
    for (const element of assetList) {
        if (element.contract_address === addr) {
            return {
                token_address: element.contract_address,
                symbol: element.symbol,
                display_name: element.display_name,
                image_url: element.image_url,
                decimals: element.decimals,
                price: undefined, // Placeholder
                tags: element.tags,
                community: element.community
            };
        }
    }
    
    return undefined; // Return null if no matching token is found
}

function riskEval(tvl: number): string {
    if (tvl > 1000000) {
        return "LOW RISK";
    } else if (tvl > 100000) {
        return "MEDIUM RISK";
    } else {
        return "HIGH RISK";
    }
}

export const countSSDash = async() => {
	try {
		//take pool info
		const r_s_p = await fetch('https://api.ston.fi/v1/pools');
        
        if (!r_s_p.ok) {
            throw new Error(`HTTP error! status: ${r_s_p.status}`);
        }

		const responsePoolData = (await r_s_p.json() as ApiPoolResponse);
		
		const cleanedSSPools: Pool[] = [];

		for (const row of responsePoolData['pool_list']) {
            if ("apy_1d" in row) {
                if (row.apy_1d !== '0') {
                    if (parseFloat(row.lp_total_supply_usd) > 1.0) {
                        cleanedSSPools.push(row);
                    }
                }
            }
        }

        //console.log(cleanedSSPools.length); // Print the length of cleaned pools
		//take asset info
		const r_s_a = await fetch('https://api.ston.fi/v1/assets');
        
        if (!r_s_a.ok) {
            throw new Error(`HTTP error! status: ${r_s_a.status}`);
        }

		const responseAssetData = (await r_s_a.json() as ApiAssetResponse);
		//take pool info
		const r_s_f = await fetch('https://api.ston.fi/v1/farms');
        
        if (!r_s_f.ok) {
            throw new Error(`HTTP error! status: ${r_s_f.status}`);
        }

		const responseFarmData = (await r_s_f.json() as ApiFarmResponse);
	
		// Array to hold enriched pool data
		const enrichedSSList: EnrichedSSPool[] = []; 

		// Loop through cleaned pools
		for (const ssPool of cleanedSSPools) {
			const tempSSDict: EnrichedSSPool = {
				pool_address: ssPool.address,
				dex: 'stonfi',
				farm_info: stonfiSearchFarm(ssPool.address, responseFarmData['farm_list']),
				token0_info: stonfiSearchToken(ssPool.token0_address, responseAssetData['asset_list']),
				token1_info: stonfiSearchToken(ssPool.token1_address, responseAssetData['asset_list']),
				lp_fee: parseInt(ssPool.lp_fee) / 100,  // Assuming lp_fee is a string
				tvl_usd: parseFloat(ssPool.lp_total_supply_usd),  // Assuming lp_total_supply_usd is a string
				apr_24h: parseFloat(ssPool.apy_1d)*100,  // Assuming apy_1d is a string
				risk: riskEval(parseFloat(ssPool.lp_total_supply_usd)),  // Adjust based on risk_eval function
			};

			if (tempSSDict.tvl_usd > 1000 && tempSSDict.token0_info?.community == false && tempSSDict.token1_info?.community == false) {
                // проверит тэги - убрали community токены 
				enrichedSSList.push(tempSSDict);
			}
            
            
		}
		//console.log(enrichedSSList);
		return enrichedSSList;
	}
	catch (e: any) { 
		console.log(e.message);
	}
}


// Define the URL for the GraphQL API
const url = "https://api.dedust.io/v3/graphql";

// Define the GraphQL query body
const Poolsbody = `
    query GetPools($filter: PoolsFiltersInput) {
        pools(filter: $filter) {
            address
            totalSupply
            type
            tradeFee
            assets
            reserves
            fees
            volume
        }
    }
`;

const Assetbody = `
      query GetAssets {
    assets {
      type
      address
      name
      symbol
      image
      decimals
      price
    }
  }
`;

const Boostbody = `
      query GetBoosts {
    boosts {
      liquidityPool
    }
  }
`;

const Promotedbody = `
      query GetPromotions {
    promotions {
      address
    }
  }
`;




type ddPool =  {
    address: string;
    totalSupply: string; // Adjust type if totalSupply is a number
    type: string; // Adjust based on the specific type of value you expect
    tradeFee: string; // Adjust to the appropriate type (e.g., number, string)
    assets: string[]; // Assuming assets is an array of strings
    reserves: string; // Adjust if this should be a number or a complex object
    fees: string; // Adjust if this should be a number or a complex object
    volume: string; // Adjust if this should be a number
}

type PoolList ={
	pools: ddPool[];
}

// Interface for the response from the GetPools query
type GetPoolsResponse = {
    data: PoolList;
}

type ddAsset =  {
      type: string;
      address: string;
      name: string;
      symbol: string;
      image: string;
      decimals: number;
      price: number;
}

type AssetList ={
	assets: ddAsset[];
}

// Interface for the response from the GetPools query
type GetAssetsResponse = {
    data: AssetList;
}

type ddBoost =  {
    liquidityPool: string;
}

type BoostList ={
	boosts: ddBoost[];
}

// Interface for the response from the GetPools query
type GetBoostsResponse = {
    data: BoostList;
}


type ddProm =  {
    address: string;
}

type PromList ={
	promotions: ddProm[]
}

// Interface for the response from the GetPools query
type GetPromotedResponse = {
    data: PromList;
}

//NOW dedust

function dedustFarmSearch(poolAddr: string, promotedList: ddProm[], boostedList: ddBoost[]): string | undefined {
    let tempRes = "";

    for (const promoted of promotedList) {
        if (promoted.address === poolAddr) {
            tempRes += 'promoted';
        }
    }

    for (const boosted of boostedList) {
        if (boosted.liquidityPool === poolAddr) {
            tempRes += 'boosted';
        }
    }

    return tempRes === "" ? undefined : tempRes;
}

function ddsearchToken(addr: string, testList: ddAsset[]): EnrichedAsset[] | undefined {
    for (const element of testList) {
        if (element.address === addr) {
            const tempElemDict: EnrichedAsset = {
                token_address: element.address,
                symbol: element.symbol,
                display_name: element.name,
                image_url: element.image,
                decimals: element.decimals,
                price: element.price,
                tags: [],
                community: false
            };
            return [tempElemDict];
        }
    }
    return undefined; // Return null if no match is found
}

function ddsearchTON(testList: ddAsset[]): EnrichedAsset[] | undefined {
    for (const element of testList) {
        if (element.type === 'native') {
            const tempElemDict: EnrichedAsset = {
                token_address: element.address,
                symbol: element.symbol,
                display_name: element.name,
                image_url: element.image,
                decimals: element.decimals,
                price: element.price,
                tags: [],
                community: false
            };
            return [tempElemDict];
        }
    }
    return undefined; // Return null if no match is found
}






export const countDDDash = async() => {
	try {
	    //Pools
		const r_d_p = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: Poolsbody,
                operationName: "GetPools"
            })
        });

        // Check if the response status indicates an error
        if (!r_d_p.ok) {
            throw new Error(`HTTP error! Status: ${r_d_p.status}`);
        }

        // Parse the JSON response
        const responseddPoolData = (await r_d_p.json() as GetPoolsResponse);
		//Assets
		const r_d_a = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: Assetbody,
                operationName: "GetAssets"
            })
        });

        // Check if the response status indicates an error
        if (!r_d_a.ok) {
            throw new Error(`HTTP error! Status: ${r_d_a.status}`);
        }

        // Parse the JSON response
        const responseddAssetData = (await r_d_a.json() as GetAssetsResponse);
		//Boosts
		const r_d_b = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: Boostbody,
                operationName: "GetBoosts"
            })
        });

        // Check if the response status indicates an error
        if (!r_d_b.ok) {
            throw new Error(`HTTP error! Status: ${r_d_b.status}`);
        }

        // Parse the JSON response
        const responseddBoostData = (await r_d_b.json() as GetBoostsResponse);
		//Promoted
		const r_d_prom = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: Promotedbody,
                operationName: "GetPromotions"
            })
        });

        // Check if the response status indicates an error
        if (!r_d_prom.ok) {
            throw new Error(`HTTP error! Status: ${r_d_prom.status}`);
        }

        // Parse the JSON response
        const responseddPromotedData = (await r_d_prom.json() as GetPromotedResponse);
		
		// to list
		const dd_pool_list = responseddPoolData['data']['pools'] as ddPool[];
		const dd_asset_list = responseddAssetData['data']['assets'] as ddAsset[];	 
		const dd_bosted_list = responseddBoostData['data']['boosts'] as ddBoost[];
		const dd_promoted_list = responseddPromotedData['data']['promotions'] as ddProm[];
		
		const cleanedDDPools: ddPool[] = [];

		for (const row of dd_pool_list) {
			if ("fees" in row) {
					// Check if the first element of 'fees' is not '0'
				if (row.fees[0] !== '0') {
					cleanedDDPools.push(row); // Append to cleanedDdPools if the condition is met
				}
			}
        }
		
		const enrichedDDList: EnrichedSSPool[] = []; 
		    
		for (const ddPool of cleanedDDPools) {
			//const tempDdDict: TempDdDict = {};
			const eraseDdDict: { [key: string]: number } = {}; // Temporary dictionary for reserves and fees

			let temp_pool_address = ddPool.address;
			//let temp_dex = 'dedust';
			let temp_farm_info = dedustFarmSearch(temp_pool_address, dd_promoted_list, dd_bosted_list);

			const tonAsset = ddsearchTON(dd_asset_list);
			const usdtAsset = ddsearchToken("EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs", dd_asset_list);
			const scaleAsset = ddsearchToken("EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE", dd_asset_list);

			let temp_token0_info;
			let temp_token1_info;
			// Determine token0_info
			if (ddPool.assets[0] === 'native') {
				temp_token0_info = tonAsset;
			} else if (ddPool.assets[0].substring(7) === 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs') {
				temp_token0_info = usdtAsset;
			} else if (ddPool.assets[0].substring(7) === 'EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE') {
				temp_token0_info = scaleAsset;
			} else {
				temp_token0_info = ddsearchToken(ddPool.assets[0].substring(7), dd_asset_list);
			}

			// Determine token1_info
			if (ddPool.assets[1] === 'native') {
				temp_token1_info = tonAsset;
			} else if (ddPool.assets[1].substring(7) === 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs') {
				temp_token1_info = usdtAsset;
			} else if (ddPool.assets[1].substring(7) === 'EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE') {
				temp_token1_info = scaleAsset;
			} else {
				temp_token1_info = ddsearchToken(ddPool.assets[1].substring(7), dd_asset_list);
			}

			const tempDecimals0 =  temp_token0_info && temp_token0_info[0]?.decimals !== 0 ? Math.pow(10, temp_token0_info[0]?.decimals): 1;

			const tempDecimals1 = temp_token1_info && temp_token1_info[0]?.decimals !== 0
				? Math.pow(10, temp_token1_info[0]?.decimals)
				: 1;

			// LP Fee
			let temp_lp_fee = ddPool.tradeFee;
			
		
			// TVL calculation
			/*
			if (ddPool.reserves[0] === '0') {
				eraseDdDict['reserves_0_usd'] = 0;
			} else {
				eraseDdDict['reserves_0_usd'] = (parseInt(ddPool.reserves[0]) / tempDecimals0) * temp_token0_info[0]?.price ;
			}

			if (ddPool.reserves[1] === '0') {
				eraseDdDict['reserves_1_usd'] = 0;
			} else {
				eraseDdDict['reserves_1_usd'] = (parseInt(ddPool.reserves[1]) / tempDecimals1) * temp_token1_info[0]?.price;
			}

			let temp_tvl_usd = eraseDdDict['reserves_0_usd'] + eraseDdDict['reserves_1_usd']; // Liquidity or TVL

			// Fees calculation
			if (ddPool.fees[0] === '0') {
				eraseDdDict['fees_0_usd'] = 0;
			} else {
				eraseDdDict['fees_0_usd'] = (parseInt(ddPool.fees[0]) / tempDecimals0) * temp_token0_info[0]?.price;
			}
			*/
			
			if (ddPool.reserves[0] === '0') {
				eraseDdDict['reserves_0_usd'] = 0;
			} else {
				if (temp_token0_info != undefined && temp_token0_info[0] != undefined && temp_token0_info[0].price != undefined) {
					eraseDdDict['reserves_0_usd'] = (parseInt(ddPool.reserves[0]) / tempDecimals0) * temp_token0_info[0].price ;
				} else {
					eraseDdDict['reserves_0_usd'] = 0; // or handle it as needed
				}
			}

			if (ddPool.reserves[1] === '0') {
				eraseDdDict['reserves_1_usd'] = 0;
			} else {
				if (temp_token1_info != undefined && temp_token1_info[0] != undefined && temp_token1_info[0].price != undefined) {
					eraseDdDict['reserves_1_usd'] = (parseInt(ddPool.reserves[1]) / tempDecimals1) * temp_token1_info[0].price;
				} else {
					eraseDdDict['reserves_1_usd'] = 0; // or handle it as needed
				}
			}

			let temp_tvl_usd = eraseDdDict['reserves_0_usd'] + eraseDdDict['reserves_1_usd']; // Liquidity or TVL

			// Fees calculation
			if (ddPool.fees[0] === '0') {
				eraseDdDict['fees_0_usd'] = 0;
			} else {
				if (temp_token0_info != undefined && temp_token0_info[0] != undefined && temp_token0_info[0].price != undefined) {
					eraseDdDict['fees_0_usd'] = (parseInt(ddPool.fees[0]) / tempDecimals0) * temp_token0_info[0].price;
				} else {
					eraseDdDict['fees_0_usd'] = 0; // or handle it as needed
				}
			}
			
			// APR calculation
			let temp_apr_24h;
			if (temp_tvl_usd && temp_tvl_usd > 0) {
				temp_apr_24h = ((eraseDdDict['fees_0_usd'] * 0.8 * 100) / temp_tvl_usd) * 365;
			}

			// Risk evaluation
			let temp_risk = riskEval(temp_tvl_usd);
			
			if (temp_tvl_usd > 1000 && temp_token0_info != undefined && temp_token1_info != undefined) {
				const tempDDDict: EnrichedSSPool = {
					pool_address: temp_pool_address,
					dex: 'dedust',
					farm_info: temp_farm_info,
					token0_info: temp_token0_info[0],
					token1_info: temp_token1_info[0],
					lp_fee: parseInt(temp_lp_fee),  // Assuming lp_fee is a string
					tvl_usd: temp_tvl_usd!,  // Assuming lp_total_supply_usd is a string
					apr_24h: temp_apr_24h!,  // Assuming apy_1d is a string
					risk: temp_risk,  // Adjust based on risk_eval function
				};
				enrichedDDList.push(tempDDDict);
				//rich_arr.push({nft: "https://tonscan.org/address/"+temp_addr,price: temp_price,time: temp_time,name: temp_name} as OneRich);
			}
			
			
			
		}
		//console.log(enrichedDDList);
		return enrichedDDList;
		}
	catch (e: any) { 
		console.log(e.message);
	}
}


async function fetchData() {
    const dd: EnrichedSSPool[] | undefined = await countDDDash();
    const ss: EnrichedSSPool[] | undefined = await countSSDash();
    console.log("dd lenght",dd?.length);
    console.log("ss lenght",ss?.length);
    // Merge the two arrays
	if(dd  != undefined && ss != undefined ){
	    const combinedPools: EnrichedSSPool[] = dd.concat(ss);
    
    // Sort the combined array by 'apr_24h' in descending order
		return combinedPools.sort((a, b) => b.apr_24h - a.apr_24h);
	}
	else{
		throw new TypeError('No data message');
	}    
}



const Tonload = () => {
    //const [data, setData] = useState<any | null>(null);
    
    // RETURN TYPE здесь и ниже где по рядам

    const [data, setData] = useState<EnrichedSSPool[] | undefined>(undefined);
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
  
    //https://react-bootstrap-table.github.io/react-bootstrap-table2/docs/getting-started.html

    // data map
    //((typeof row.token0_info?.symbol === 'undefined') ? row.token0_info?.symbol : "-"  +"/"+ (typeof row.token1_info?.symbol === 'undefined') ? row.token1_info?.symbol : "-")
    const tableData = data.map((row: EnrichedSSPool,index) => {
        return {
            index: index+1,
            Pool: row,
            Dex: row.dex,
            Risk: row.risk,
            APY: Number((row.apr_24h).toFixed(2)),
            TVL: Number(row.tvl_usd.toFixed(2)),
            Farm: row
          } 
      });

    function farmFormatter(row:EnrichedSSPool) {
        if(row.dex== "stonfi" && row.farm_info != undefined){
            return "Stonfi Farm: " + (Number(row.farm_info)*100).toFixed(2).toString() + "%"
        }
        else if (row.dex== "dedust" && row.farm_info != undefined){
            if(row.farm_info=="promoted"){
                return "Dedust: promoted"
            } else if(row.farm_info=="boosted") {
                return "Dedust: boosted"
            } else {
                return "Dedust: boosted and promoted"
            }
        }
        else {
            return undefined;
        }
    }

    //Filters

    const selectOptionsRisk: { [index: string]: string } = {
        "LOW RISK": "LOW RISK",
        "MEDIUM RISK": "MEDIUM RISK",
        "HIGH RISK": "HIGH RISK"
    };
    
      

    // columns
    const columns = [{
        dataField: 'index',
        text: '#'
      }, {
        dataField: 'Pool',
        text: 'Pool',
        formatter: (row: EnrichedSSPool) => (
            <div>
              <a href={row.dex == "dedust" ? "https://dedust.io/pools/"+row.pool_address : "https://app.ston.fi/pools/"+row.pool_address}  target="_blank" rel="noopener noreferrer"> {row.token0_info?.symbol+"/"+row.token1_info?.symbol } </a>
            </div>
          )
      }, {
        dataField: 'Dex',
        text: 'DEX'
      },{
        dataField: 'Risk',
        text: '',
        formatter: (cell: string)  => selectOptionsRisk[cell] ,
        filter: selectFilter({
          placeholder: "Risk ⛛",
          options: selectOptionsRisk,
          className: "btn btn-dark dropdown-toggle"
          //https://react-bootstrap-table.github.io/react-bootstrap-table2/docs/basic-filter.html#programmatically-filter
       }),
       
       
      }, {
        dataField: 'APY',
        text: 'Fee APY 24h, %',
        sort: true
      }, {
        dataField: 'TVL',
        text: 'TVL, USD',
        sort: true
      }, {
        dataField: 'Farm',
        text: 'Farm Info',
        formatter: farmFormatter
      }
      
    ];
  
    return (
      <div className="bg-dark">
      <Container>
      <h2 className="text-white">Analyse <span style={{color: "#0098ea"}}>TON pools</span> and find the best liquidity pools before everyone</h2>
      <p className="text-secondary">Make smarter crypto investing decisions with our pool data.</p>
      <p className="text-secondary">How to use this page: <a style={{ textDecoration: 'none' }} href="https://t.me/ton_learn/" target="_blank" rel="noopener noreferrer">here</a></p>

        <BootstrapTable bootstrap4 keyField='index' data={ tableData } columns={ columns }  filter={ filterFactory() }  striped bordered hover classes='table-dark'/>
    
      </Container>
      </div>
    )
  
    }
  
//classes='table-dark'
// https://github.com/NovatecConsulting/novatec-service-dependency-graph-panel/blob/279814dd6efcac7238aad79fc637e31dc3f00915/src/panel/statistics/SortableTable.tsx#L36
  
  export default Tonload;

/*
  <Row>
  <Col>
  <Dropdown className="" autoClose="outside" data-bs-theme="dark">
    <Dropdown.Toggle id="dropdown-autoclose-outside" size="sm" variant="secondary">
      Risk
    </Dropdown.Toggle>

    <Dropdown.Menu>
        <Form>
            <Form.Check
            name={"LOW RISK"}
            type="checkbox"
            label="LOW RISK" />
            <Form.Check
            name={"MEDIUM RISK"}
            type="checkbox"
            label="MEDIUM RISK" />
            <Form.Check
            name={"HIGH RISK"}
            type="checkbox"
            label="HIGH RISK" />
        </Form>
    </Dropdown.Menu>
  </Dropdown>
  </Col>
  </Row>
*/