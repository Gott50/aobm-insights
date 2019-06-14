import React from 'react';
import './App.css';
import items from './items';

export default class App extends React.Component {
    state = {
        data: []
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
            <th>Name</th>
            <th>Diff</th>
            <th>buy_price_max</th>
            <th>sell_price_min</th>
            <th>buy_price_max_date</th>
            <th>sell_price_min_date</th>
        </tr>;
    }

    renderRow(dataRow = [], index=0) {
        return <tr key={index}>
            {dataRow.map((data, index)=> <td key={index}>{data}</td>)}
        </tr>;
    }

    renderRows(dataRows = []) {
        return dataRows.map(this.renderRow);
    }

    async componentDidMount() {
        let listNameIDs = items.map(i => i.LocalizationNameVariable.replace("@ITEMS_", ""));

        for (let index = 0; index < listNameIDs.length; index += 200) {
            let id = listNameIDs.slice(index, index + 200);
            let item = await this.fetchWithID(id);
            this.setState(p => ({data: p.data.concat(this.buildData(item))}));

        }

    }

    getLocalizedName(id) {
        let i = items.filter(i =>i.LocalizationNameVariable.indexOf(id) !== -1)[0];
        return i && i.LocalizedNames.filter(n => n.Key === "EN-US")[0].Value;
    }

    async fetchWithID(id) {
        let response = await fetch("https://www.albion-online-data.com/api/v1/stats/prices/" + id +
            "?locations=Caerleon,Black Market");
        return await response.json();
    }

    buildData(data){
        if (data.length < 2)
            return [];

        let dataCaerleon = data.filter(e => e.city === "Caerleon");
        let dataBlackMarket = data.filter(e => e.city === "Black Market");

        function caerleon(bm) {
            return dataCaerleon.filter(c => c.item_id === bm.item_id);
        }

        let result = dataBlackMarket.map(bm => this.buildRow(bm, caerleon(bm)[0]));
        console.log(result)
        // result = result.filter(row => row[1] > 0);
        return result;
    }

    buildRow(itemBlackMarket, itemCaerleon) {
        let name = this.getLocalizedName(itemBlackMarket.item_id)
        let diff = itemBlackMarket.buy_price_max - itemCaerleon.sell_price_min;
        return [itemBlackMarket.item_id, name, diff, itemBlackMarket.buy_price_max, itemCaerleon.sell_price_min,
            itemBlackMarket.buy_price_max_date, itemCaerleon.sell_price_min_date]
    }
}
