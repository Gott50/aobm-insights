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
            <th>BQ</th>
            <th>SQ</th>
            <th>Name</th>
            <th>Diff</th>
            <th>Margin</th>
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
        let listNameIDs = items.map(i => {
            let id = i.LocalizationNameVariable.replace("@ITEMS_", "");
            return `${id},${id}@1,${id}@2,${id}@3`;
        });

        for (let index = 0; index < listNameIDs.length; index += 40) {
            let id = listNameIDs.slice(index, index + 40);
            let item = await this.fetchWithID(id);
            this.setState(p => {
                let data = p.data.concat(this.buildData(item));
                data.sort((a, b) => b[5] - a[5]);
                return {data};
            });
        }
        alert("DONE")
    }

    getLocalizedName(id) {
        let id_name = id.split("@")[0];
        let i = items.filter(i =>i.LocalizationNameVariable.indexOf(id_name) !== -1)[0];
        return i && i.LocalizedNames.filter(n => n.Key === "EN-US")[0].Value;
    }

    async fetchWithID(id) {
        let response = await fetch("https://www.albion-online-data.com/api/v2/stats/prices/" + id +
            "?locations=Caerleon,Black Market&qualities=1,2,3,4,5,6");
        return await response.json();
    }

    buildData(data){
        if (data.length < 2)
            return [];

        let dataCaerleon = data.filter(e => e.city === "Caerleon");
        let dataBlackMarket = data.filter(e => e.city === "Black Market");

        function caerleon(bm) {
            let items = dataCaerleon.filter(c => c.item_id === bm.item_id && c.quality >= bm.quality);
            items.sort((a, b) => b.sell_price_min - a.sell_price_min);
            return items;
        }

        let result = dataBlackMarket.map(bm => this.buildRow(bm, caerleon(bm)[0]));
        result = result.filter(row => row[4] > 0);
        return result;
    }

    buildRow(itemBlackMarket, itemCaerleon) {
        if (!itemBlackMarket || !itemCaerleon || itemBlackMarket.buy_price_max <= 0 || itemCaerleon.sell_price_min <= 0)
            return []

        let name = this.getLocalizedName(itemBlackMarket.item_id)
        let diff = itemBlackMarket.buy_price_max - itemCaerleon.sell_price_min;
        let margin = diff / itemBlackMarket.buy_price_max;
        return [itemBlackMarket.item_id, itemBlackMarket.quality, itemCaerleon.quality, name, diff, margin, itemBlackMarket.buy_price_max, itemCaerleon.sell_price_min,
            itemBlackMarket.buy_price_max_date, itemCaerleon.sell_price_min_date]
    }
}
