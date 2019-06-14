import React from 'react';
import './App.css';
import items from './items';

export default class App extends React.Component {
    state = {
        data:[]
    }

    render() {
        return (
            <div className="App">
                <table style={{width: "100%"}}>
                    <tbody>
                    {this.renderNames()}
                    {this.renderRows(this.state.data)}
                    </tbody>
                </table>
            </div>
        );
    }

    renderNames() {
        return <tr>
            <th>item_id</th>
            <th>Diff</th>
            <th>buy_price_max</th>
            <th>sell_price_min</th>
            <th>buy_price_max_date</th>
            <th>sell_price_min_date</th>
        </tr>;
    }

    renderRow(dataRow = []) {
        return <tr>
            {dataRow.map(data => <td>{data}</td>)}
        </tr>;
    }

    renderRows(dataRows = []) {
        return dataRows.map(this.renderRow);
    }

    async componentDidMount() {
        let listIDs = items.map(i => i.LocalizationNameVariable.replace("@ITEMS_", ""));

        for (let index = 0; index < listIDs.length; index++) {
            let items1 = await this.fetchWithID(listIDs[index]);

            this.setState(p=>({data: p.data.concat(this.buildData(items1))}));

        }

    }

    async fetchWithID(id) {
        let response = await fetch("https://www.albion-online-data.com/api/v1/stats/prices/" + id +
            "?locations=Caerleon,Black Market");
        return await response.json();
    }

    buildData(data) {
        if(data.length < 2)
            return [];

        let dataCaerleon = data.filter(e => e.city === "Caerleon");
        let dataBlackMarket = data.filter(e => e.city === "Black Market");

        let result =  dataBlackMarket.map(bm => this.buildRow(bm, dataCaerleon.filter(c => c.item_id === bm.item_id)[0]));
        console.log(result)
        result = result.filter(row => row[1] > 0);
        return result;
    }

    buildRow(itemBlackMarket, itemCaerleon) {
        console.log({itemBlackMarket, itemCaerleon})
        let diff = itemBlackMarket.buy_price_max - itemCaerleon.sell_price_min;
        return [itemBlackMarket.item_id, diff, itemBlackMarket.buy_price_max, itemCaerleon.sell_price_min,
            itemBlackMarket.buy_price_max_date, itemCaerleon.sell_price_min_date]
    }
}
