import { useEffect, useState, useCallback } from "react";
import { UnstructuredClient } from "unstructured-client";
import { PartitionResponse } from "unstructured-client/sdk/models/operations";
import { Strategy } from "unstructured-client/sdk/models/shared";
import {PdfProps, UnstructuredClientProps} from './types';
import {Button} from 'antd';
import {PlusOutlined} from '@ant-design/icons';
import { nanoid } from 'nanoid';
const { ipcRenderer } = window as any;

interface UpLoadPdfProps extends UnstructuredClientProps {
    style?: React.CSSProperties;
}

export default function UpLoadPdf({ serverURL, style }: UpLoadPdfProps) {
    const [client, setClient] = useState<UnstructuredClient>();
    const [pdf, setPDF] = useState<PdfProps>();
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const clt = new UnstructuredClient({
            serverURL: serverURL ? serverURL: "http://localhost:5051/general/v0",
            retryConfig: {
                strategy: "backoff",
                backoff: {
                    initialInterval: 1,
                    maxInterval: 50,
                    exponent: 1.1,
                    maxElapsedTime: 100,
                },
                retryConnectionErrors: false,
            },
        });
        if (clt) setClient(clt);
        else console.error('Connection failed');
    }, []);
    const upload_file = useCallback(
        async ()=>{
            if (ipcRenderer) {
                setLoading(true);
                const filePath = await ipcRenderer.fileOpenDialog() as string;
                setLoading(false);
                if (filePath) setPDF({src: filePath} as PdfProps);
            } else {
                console.error('API does not exist');
            }
        }, []
    );

    useEffect( () => {
        if (!pdf) {
            return;
        }
        setLoading(true);
        ipcRenderer.fileRead(pdf.src).then((data: Uint8Array) => {
            client?.general.partition({
                partitionParameters: {
                    files: {
                        content: data,
                        fileName: pdf.src,
                    },
                    strategy: Strategy.Fast,
                    coordinates: true,
                    multipageSections: true,
                    contentType: 'application/pdf',
                    splitPdfPage: false,
                },
            }).then((res: PartitionResponse) => {
                setLoading(false);
                if (res.statusCode == 200) {
                    var data: string[] = [];
                    var meta: {}[] = [];
                    var ids: string[] = [];
                    var content = '';
                    res.elements?.forEach(element => {
                        content += element.text;
                        data.push(element.text);
                        ids.push(nanoid());
                        meta.push({});
                        // const capturingRegex = /\bFigure\s\d+:/g;
                        // const found = element.text?.match(capturingRegex);
                        // console.log(element.text);
                    });
                    console.log(content);
                    ipcRenderer.knowledgeNote({data: data, ids: ids, meta: meta});
                }
            }).catch((e) => {
                setLoading(false);
                console.error(`${e.statusCode}: ${e.body}`);
            });
        });
    }, [pdf]);

    return (
    <Button type="primary" shape="circle" icon={<PlusOutlined />} onClick={upload_file} loading={loading}
        style={style}/>
    );
}