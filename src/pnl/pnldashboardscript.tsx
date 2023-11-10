

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
    
    
    export type frontRes = {
        addr_str: string;
        total_pnl: number;
        details: ResultArr; 
        realised_profit: number;
        roi: number;
        total_txes_count: number;
    }
    
    
    export const countPnL = (addr_str: string,operationsData: ApiResponse) => {
        try {
    
            const temp_oper: {
                operation: Operation;
                asset0_info: AssetInfo;
                asset1_info: AssetInfo;
            }[] = [];
            
            for (const row of operationsData['operations']) {
                if (row.operation.destination_wallet_address === addr_str) {
                    temp_oper.push(row);
                }
            }
                    
            const responseData = { operations: temp_oper } as ApiResponse
    
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
            
            let total_txes_counter = 0;
            for (const item of result_arr) {
                total_txes_counter += item.txes.length;
            }
            front_json['total_txes_count'] = total_txes_counter;
            
            
            //console.log(front_json);
            return front_json;
            
        }
        catch (e: any) { 
            console.log(e.message);
        }
    }
    
    function now_utc(): string {
        return new Date().toISOString().slice(0, -5);
    }
    
    function thirty_days_utc(): string {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return thirtyDaysAgo.toISOString().slice(0, -5);
    }
    
    function seven_days_utc(): string {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return sevenDaysAgo.toISOString().slice(0, -5);
    }
    
    function day_utc(): string {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        return oneDayAgo.toISOString().slice(0, -5);
    }
    
    
    
    function return_more_then_one(myList: string[]): string[] {
        const counts: {[key: string]: number} = {};
        for (const value of myList) {
        counts[value] = (counts[value] || 0) + 1;
        }
    
        const out_list: string[] = [];
        for (const value in counts) {
            if (counts[value] > 1) {
            out_list.push(value as string);
            }
        }
    
        return out_list;
    }
    
    
    
    export const dashboardPnL = async(days: number) => {
        try {
            var payload = {
                since: day_utc(),
                until: now_utc(),
            };
            
            if (days == 1) 
            {
                var payload = {
                    since: day_utc(),
                    until: now_utc(),
                };
            } 
            else if (days == 7)
            {
                var payload = {
                    since: seven_days_utc(),
                    until: now_utc(),
                };
            }
            else if (days == 30) 
            {
                var payload = {
                    since: thirty_days_utc(),
                    until: now_utc(),
                };
            }
    
            //console.log(payload);
    
            const url = new URL(`https://api.ston.fi/v1/stats/operations`);
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
              //console.log(`Error! status: ${response.status}`);
              throw new Error(`Error! status: ${response.status}`);
              return {};
            }
            
        
            const operationsData = (await response.json() as ApiResponse);
            
            //console.log(operationsData['operations'])
            
            
            const temp_alladdr_arr: string[] = [];
    
            for (const operation of operationsData['operations']) {
                if (
                operation.operation.operation_type === 'swap' &&
                operation.operation.exit_code === 'swap_ok'
                ) {
                if (
                operation.asset1_info.contract_address === 'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez' ||
                operation.asset0_info.contract_address === 'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez'
                ) {
                temp_alladdr_arr.push(operation.operation.destination_wallet_address);
                }
                }
            }
    
    
            const more_than_2_occur = return_more_then_one(temp_alladdr_arr);
            //const count = more_than_2_occur.length;
    
            //console.log(count);
            
            const counted_arr: frontRes[] = [];
    
            //Make some tests here later
            //if (responseData.operations.length < 1) {
            //	return {};
            //}
    
    
            for (const item_addr of more_than_2_occur) {
                counted_arr.push(countPnL(item_addr, operationsData )!);
            }
            
            //console.log(counted_arr.length);
        
            const sorted_pnl = counted_arr.sort((a, b) => b.total_pnl - a.total_pnl);
            const top100_sorted_pnl = sorted_pnl.slice(0, 100);
            return top100_sorted_pnl as frontRes[];	
            //console.log(top100_sorted_pnl);
            
        }
        catch (e: any) { 
            console.log(e.message);
        }
    }