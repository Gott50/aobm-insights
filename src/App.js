import React from 'react';
import items from './items';
import * as async from "async";
import notification from './notification.m4a'

export default class App extends React.Component {
    state = {
        data: [],
        minDiff: 10000,
        minMargin: 10,
        maxAge: 1,
        timeout: 10000,
        capital: 0,
    }

    constructor(props) {
        super(props);
        this.playAudio = () => {this.audio.play();}
    }

    render() {
        return (
            <div className="App">
                <label>minDiff:
                    <input type="number" value={this.state.minDiff} onChange={event => this.setState({minDiff: Number(event.target.value)})}/>
                </label>
                <label>minMargin:
                    <input type="number" value={this.state.minMargin} onChange={event => this.setState({minMargin: Number(event.target.value)})}/>
                </label>
                <label>maxAge:
                    <input type="number" value={this.state.maxAge} onChange={event => this.setState({maxAge: Number(event.target.value)})}/>
                </label>
                <label>timeout:
                    <input type="number" value={this.state.timeout} onChange={event => this.setState({timeout: Number(event.target.value)})}/>
                </label>
                <label>capital:
                    <input type="number" value={this.state.capital} onChange={event => this.setState({capital: Number(event.target.value)})}/>
                </label>
                <table style={{width: "100%"}}>
                    <tbody>
                    {this.renderNames()}
                    {this.renderRows(this.state.data)}
                    </tbody>
                </table>
                <audio ref={(audio) => {this.audio = audio;}}>
                    <source src={notification} type="audio/mpeg"/>
                </audio>
            </div>
        );
    }

    componentDidMount() {
        const componentDidMount = this.componentDidMount.bind(this);
        setTimeout(() => {
            console.log("run Loop")

            let listNameIDs = items.map(i => {
                let id = i.LocalizationNameVariable.replace("@ITEMS_", "");
                return `${id},${id}@1,${id}@2,${id}@3`;
            });

            let paraList = listNameIDs.reduce((memo, value, index) => {
                if (index % 40 === 0 && index !== 0) memo.push([])
                memo[memo.length - 1].push(value)
                return memo
            }, [[]]);
            async.each(paraList, this.fetchData.bind(this), componentDidMount);
        }, this.state.timeout);
    }

    fetchData(id, callback) {
        this.fetchWithID(id).then(item => {
            this.setState(p => {
                let newData = this.buildData(item);
                newData = newData.filter(i => !p.data.filter(n => i[8] === n[8] && i[9] === n[9]).length);
                let pData = p.data.filter(i => !newData.filter(n => i[0] === n[0] && i[1] === n[1]).length);
                let data = pData.concat(newData);
                // data.sort((a, b) => b[5] - a[5]);

                if (this.state.minMargin > 0) data = data.filter(row => Number(row[5]) >= this.state.minMargin);
                if (this.state.minDiff > 0) data = data.filter(row => Number(row[4]) >= this.state.minDiff);
                if (this.state.capital > 0) data = data.filter(row => Number(row[7]) <= this.state.capital);
                data = data.filter(row => this.isJoung(row[8]));

                data.sort((a, b) => new Date(b[8]) - new Date(a[8]) || b[5] - a[5]);

                if (String(p.data[0]) !== String(data[0]))
                    this.playAudio();

                return {data};
            });
        }).then(callback).catch(alert);
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
        let dataTD = [...dataRow];
        for (let i = dataRow.length - 2; i < dataRow.length; i++) {
            dataTD[i] = <input type="checkbox"
                               checked={dataRow[i]}
            onChange={this.handleChaneOfCheckBox(index, i).bind(this)}
            />
        }

        return <tr key={index}>
            {dataTD.map((data, index)=> <td key={index}>{data}</td>)}
        </tr>;
    }

    handleChaneOfCheckBox = (index, i) => (event) => {
        const checked = event.target.checked;
        return this.setState(p => {
            let data = p.data;
            data[index][i] = checked;
            return {data};
        });
    }

    renderRows(dataRows = []) {
        return dataRows.map(this.renderRow.bind(this));
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
        return result;
    }

    isJoung(date) {
        return new Date(date) >= new Date(Date.now() - (2 + this.state.maxAge) * 3600 * 1000);
    }

    buildRow(itemBlackMarket, itemCaerleon) {
        if (!itemBlackMarket || !itemCaerleon || itemBlackMarket.buy_price_max <= 0 || itemCaerleon.sell_price_min <= 0)
            return []

        let name = this.getLocalizedName(itemBlackMarket.item_id)
        let diff = itemBlackMarket.buy_price_max - itemCaerleon.sell_price_min;
        let margin = 100 * diff / itemBlackMarket.buy_price_max;

        return [itemBlackMarket.item_id, itemBlackMarket.quality, itemCaerleon.quality, name, diff, margin.toFixed(2), itemBlackMarket.buy_price_max, itemCaerleon.sell_price_min,
            itemBlackMarket.buy_price_max_date, itemCaerleon.sell_price_min_date, false, false]
    }
}
