import React, { useEffect, useState } from 'react';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

const url = "https://localhost:4000";

export const ImageFragments: React.FC = () => {
    const [image, setImage] = useState<File | null>(null);
    const [rows, setRows] = useState<number>(0);
    const [cols, setCols] = useState<number>(0);
    const [fragments, setFragments] = useState<string[]>([]);
    const [hubConnection, setHubConnection] = useState<HubConnection>();

    const [sendRows, setSendRows] = useState<number>(0);
    const [sendCols, setSendCols] = useState<number>(0);

    // Create Hub connection
    const createHubConnection = async () => {
        const hc = new HubConnectionBuilder().withUrl(`${url}/fragment`).build();
        try {
            await hc.start();
        } catch (e) {
            console.log(e);
        }
        setHubConnection(hc);
    };

    useEffect(() => {
        createHubConnection();
    }, []);

    useEffect(() => {
        hubConnection && hubConnection.on("ReceiveFragment",
            fragment => setFragments(prev => {
                return prev.indexOf(fragment) === -1 ? prev.concat(fragment) : prev;
            }));
    }, [hubConnection]);

    // Select image
    const selectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedImage = event.target.files && event.target.files[0];
        if (selectedImage)
            setImage(selectedImage);
    };

    // Send image
    const submitImage = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFragments([]);

        if (!image || !cols || !rows) {
            alert("Invalid input data!");
            return;
        }
        setSendRows(rows);
        setSendCols(cols);

        const formData = new FormData();
        formData.append('image', image);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${url}/image/fragments/${rows}/${cols}`, true);
        xhr.send(formData);
    };

    // Set style of fragmets (loading or not)
    const fragmentStyle: React.CSSProperties = {
        width: `${Math.round(1600 / sendCols)}px`,
        height: `${Math.round(1200 / sendRows)}px`,
        backgroundColor: 'gray',
        margin: '5px'
    };

    return (<div>
        <form onSubmit={submitImage} className="form-upload" >
            <div> {!!image
                ? <img src={URL.createObjectURL(image)} className='image-upload' />
                : <div className='image-upload'>Select image to send</div>
            }</div>
            <div>
                <h3>ImageFragments</h3>
                <input type="file" accept="image/*" onChange={selectImage} />
                <div style={{ display: 'flex' }} >
                    <span> Rows: </span>
                    <input type="number" onChange={e => setRows(e.target.valueAsNumber)} />
                </div>
                <div style={{ display: 'flex' }} >
                    <span> Columns: </span>
                    <input type="number" onChange={e => setCols(e.target.valueAsNumber)} />
                </div>
                <button type="submit" > Send image </button>
            </div>
        </form>
        <div id="container" className='fragments-container'>
            {Array.from({
                length: sendCols * sendRows && fragments?.length > 0 ? sendCols * sendRows : 0
            }).map((_, i) => !!fragments[i]
                ? <img key={i} style={fragmentStyle} src={`data:image/jpeg;base64,${fragments[i]}`} />
                : <img key={i} style={fragmentStyle} />)}
        </div>
    </div>);
}