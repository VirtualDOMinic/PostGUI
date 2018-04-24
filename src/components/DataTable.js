import React, { Component } from 'react';
import ReactTable from 'react-table';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';

import Downloads from './Downloads.js';
import EditCard from './EditCard.js';

import axios from 'axios';
import "react-table/react-table.css";

let lib = require('../utils/library.js');
let json2csv = require('json2csv');


class DataTable extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dbIndex: props.dbIndex,
            table: props.table,
            columns: props.columns,
            data: props.data,
            url: props.url,
            dbPrimaryKeys: [],
            tablePrimaryKeys: [],
            editFeatureEnabled: false,
            editFeatureChangesMade: {}
        };
        this.renderEditableCell = this.renderEditableCell.bind(this);
    }

    componentWillReceiveProps(newProps) {
        this.setState({
            dbIndex: newProps.dbIndex,
            table: newProps.table,
            columns: newProps.columns,
            url: newProps.url,
            data: newProps.data,
            editFeatureEnabled: this.state.table !== newProps.table ? false : this.state.editFeatureEnabled
        });
    }

    // Allows EditCard.js to change the state here
    changeEditFeatureEnabled(featureEnabled) {
        this.setState({
            editFeatureEnabled: featureEnabled
        });
    }

    // Allows EditCard.js to change the state here
    changeEditFeatureChangesMade(newChanges) {
        this.setState({
            editFeatureChangesMade: newChanges
        });
    }

    // Renders an editable cell + manages changes made to it using helpers
    renderEditableCell(cellInfo) {
        return (
            <div
                style={{ backgroundColor: "#fafafa", border: "1px solid red" }}
                contentEditable
                suppressContentEditableWarning
                onBlur={e => {
                    const data = [...this.state.data];
                    // ToDo: when original value is NULL, and you don't change it, it sets it to "" from NULL... prevent it
                    if (String(data[cellInfo.index][cellInfo.column.id]) !== String(e.target.innerHTML)) {
                        console.log(cellInfo.column.id, "column of row #", cellInfo.index, "changed from ", data[cellInfo.index][cellInfo.column.id], "to", e.target.innerHTML);
                        let oldRow = JSON.stringify(this.state.data[cellInfo.index]);
                        console.log("Original row: " + JSON.stringify(this.state.data[cellInfo.index]));
                        data[cellInfo.index][cellInfo.column.id] = e.target.innerHTML;
                        let newRow = this.state.data[cellInfo.index];
                        //this.updateDbIfNeeded(oldRow, newRow, cellInfo.column.id);
                        this.setState({ data }, () => {
                            console.log("Updated row: " + JSON.stringify(this.state.data[cellInfo.index]));
                        });
                    }
                }}
                dangerouslySetInnerHTML={{
                    __html: this.state.data[cellInfo.index][cellInfo.column.id]
                }}
            />
        );
    }

    render() {
        //const classes = this.props.classes;
        let { columns, data } = this.state;
        let parsedColumns = [];

        // Create columns with expected column properties
        if (columns) {
            parsedColumns = columns.map((columnName) => {
                let columnRename = lib.getColumnConfig(this.state.dbIndex, this.state.table, columnName, "rename");
                let columnVisibility = lib.getColumnConfig(this.state.dbIndex, this.state.table, columnName, "visible");
                let columnEditability = lib.getColumnConfig(this.state.dbIndex, this.state.table, columnName, "editable");

                let columnWidthDefault = lib.getTableConfig(this.state.dbIndex, this.state.table, "defaultWidthPx");
                let columnWidth = lib.getColumnConfig(this.state.dbIndex, this.state.table, columnName, "widthPx");

                let columnMinWidth = lib.getColumnConfig(this.state.dbIndex, this.state.table, columnName, "minWidthPx");
                let columnMaxWidth = lib.getColumnConfig(this.state.dbIndex, this.state.table, columnName, "maxWidthPx");


                return ({
                    id: columnName,
                    Header: columnRename ? columnRename : columnName,
                    accessor: columnName,
                    show: columnVisibility !== null ? columnVisibility : true,
                    width: columnWidth !== null ? columnWidth : (columnWidthDefault ? columnWidthDefault : undefined),
                    maxWidth: columnMaxWidth !== null ? columnMaxWidth : undefined,
                    minWidth: columnMinWidth !== null ? columnMinWidth : 100,
                    headerStyle: { fontWeight: 'bold' },
                    Cell: this.state.editFeatureEnabled === true && columnEditability !== false ? this.renderEditableCell : null
                });
            });
        }

        // render()
        return (
            <div>
                <ReactTable
                    data={data}
                    columns={parsedColumns}
                    defaultPageSize={10} className="-striped -highlight"
                    pageSizeOptions={[10, 50, 100, 200, 500, 1000]}
                    previousText="Previous Page"
                    nextText="Next Page"
                    noDataText={this.props.noDataText} />

                <div className={this.props.classes.cardGroups} >
                    <EditCard
                        dbIndex={this.state.dbIndex}
                        table={this.state.table}
                        columns={this.state.columns}
                        dbPkInfo={this.props.dbPkInfo}
                        url={this.state.url}
                        featureEnabled={this.state.editFeatureEnabled}
                        changesMade={this.state.editFeatureChangesMade}
                        changeEditFeatureChangesMade={this.changeEditFeatureChangesMade.bind(this)}
                        changeEditFeatureEnabled={this.changeEditFeatureEnabled.bind(this)} />

                    <Downloads
                        dbIndex={this.state.dbIndex}
                        table={this.state.table}
                        columns={this.state.columns}
                        data={this.state.data}
                        url={this.state.url}
                        totalRows={this.props.totalRows} />
                </div>
            </div>);
    }
}

DataTable.propTypes = {
    classes: PropTypes.object.isRequired,
};

const styleSheet = {
    root: {
        width: '29%',
        height: '100%',
        float: 'left',
    },
    headerClass: {
        fontWeight: "bold"
    },
    button: {
        margin: 5,
        float: 'right'
    },
    topMargin: {
        margin: 5,
        marginTop: (5) * 5
    },
    cardGroups: {
        display: 'flex',
        flexDirection: 'row'
    }
};
export default withStyles(styleSheet)(DataTable);