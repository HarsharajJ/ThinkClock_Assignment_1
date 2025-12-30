declare module 'react-plotly.js' {
    import * as Plotly from 'plotly.js';
    import * as React from 'react';

    interface PlotParams {
        data: Plotly.Data[];
        layout?: Partial<Plotly.Layout>;
        config?: Partial<Plotly.Config>;
        frames?: Plotly.Frame[];
        style?: React.CSSProperties;
        className?: string;
        useResizeHandler?: boolean;
        onInitialized?: (figure: Readonly<Plotly.Figure>, graphDiv: Readonly<HTMLElement>) => void;
        onUpdate?: (figure: Readonly<Plotly.Figure>, graphDiv: Readonly<HTMLElement>) => void;
        onPurge?: (figure: Readonly<Plotly.Figure>, graphDiv: Readonly<HTMLElement>) => void;
        onError?: (err: Readonly<Error>) => void;
        divId?: string;
    }

    const Plot: React.FC<PlotParams>;
    export default Plot;
}

declare module 'react-barcode' {
    import * as React from 'react';

    interface BarcodeProps {
        value: string;
        format?: string;
        width?: number;
        height?: number;
        displayValue?: boolean;
        text?: string;
        fontOptions?: string;
        font?: string;
        textAlign?: string;
        textPosition?: string;
        textMargin?: number;
        fontSize?: number;
        background?: string;
        lineColor?: string;
        margin?: number;
        marginTop?: number;
        marginBottom?: number;
        marginLeft?: number;
        marginRight?: number;
        flat?: boolean;
        ean128?: boolean;
        lastValid?: boolean;
        valid?: (valid: boolean) => void;
    }

    const Barcode: React.FC<BarcodeProps>;
    export default Barcode;
}
