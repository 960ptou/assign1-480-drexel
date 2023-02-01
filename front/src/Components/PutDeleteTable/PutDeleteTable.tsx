import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid, GridRowId } from '@mui/x-data-grid';

// https://codesandbox.io/s/66424752-get-row-item-on-checkbox-selection-in-react-material-ui-data-grid-forked-z61hc2?file=/demo.tsx

interface rowCol {
    rows : any;  // This is too much for typing..
    columns : any;
    baseUrl : string;
    reload : () => void;
}


export function PutDeleteTable(props : rowCol) {
    const [selectedRows, setSelectedRows] = React.useState<{id : string, [key: string]: string}[]>([]);
    
    const baseUrl = props.baseUrl;
    const data = {
        rows : props.rows,
        columns : props.columns,
    }

    async function sendDelete() {
        for (const row of selectedRows){
            try{
                const delUrl = `${baseUrl}/${row.id}`
                const res = await fetch(delUrl, { method: "DELETE" });
                const data = await res.json();
                if (res.ok){
                    console.log("Success", data); // Debug
                } else{
                    window.alert(data.error); // show error
                    console.log("Failed"); // Debug
                    break;
                }
            } catch (error: any) {
                console.log(error, "ERROR"); // REMOVE
            }
        }
    }

    async function sendUpdate(updateData : {}){
        try{
            const putURL = `${baseUrl}`
            const res = await fetch(putURL, { 
                method: "PUT",
                body: JSON.stringify(updateData),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const data = await res.json();
            if (res.ok){
                console.log("Success", data); // Debug
            } else{
                window.alert(data.error); // show error
                console.log("Failed"); // Debug
            }
        } catch (error: any) {
            console.log(error, "ERROR"); // REMOVE
        }
    }

    function onCellEdit(row: any, columnId: any, value: any){
        let copy = structuredClone(data.rows.find((r: { id: any; }) => r.id === row.id));
        copy[row.field] = row.value;
        console.log(copy); // DEBUG
        sendUpdate(copy);
    };

    return (
        <div style={{ height: 400, width: "100%" }}>
            <Button onClick={() => {
                if (window.confirm("Do you want to Delete Those records?")){
                    sendDelete();
                    props.reload();
                }
                }}> Delete ALL Selected </Button>
        <DataGrid
            checkboxSelection
            onCellEditCommit={onCellEdit}
            onSelectionModelChange={(ids) => {
                const selectedIDs = new Set(ids);
                const selectedRows = data.rows.filter((row: { id: GridRowId; }) =>
                    selectedIDs.has(row.id)
                );
                setSelectedRows(selectedRows);
            }}
            {...data}
        />
        </div>
    );

}