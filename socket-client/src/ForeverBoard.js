import React from 'react';
import Immutable from 'immutable';
import socketIOClient from "socket.io-client";

class ForeverBoard extends React.Component {
    constructor() {
        super();
        this.state = {
            isDrawing: false,
            lines: new Immutable.List(),

            // name of the server you are running server js on
            endpoint: "http://foreverboard.eastus.cloudapp.azure.com:4001"
        };
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.socket = socketIOClient(this.state.endpoint);
        this.path = window.location.pathname;
        this.socket.on('fullRefresh', (serverLines, path) => {
            if (path !== this.path)
                return;
            this.setState({
                lines: new Immutable.List(serverLines).map(line =>
                    new Immutable.List(line).map(pt =>
                        new Immutable.Map(pt)))
            })
        });
    }

    render() {
        return (
            <div style={{ textAlign: "center" }}>
                <div className="drawArea"
                    ref="drawArea"
                    onMouseDown={this.handleMouseDown}
                    onMouseMove={this.handleMouseMove} >
                    <Drawing lines={this.state.lines} />
                </div>
                <br />
                <button onClick={() => this.clear()}>Clear</button>
            </div>

        );
    }
    clear() {
        this.setState({
            lines: new Immutable.List()
        }, () => {
            this.socket.emit('Clear', this.path)
        });
    }

    handleMouseDown(mouseEvent) {
        if (mouseEvent.button !== 0) {
            return;
        }
        const point = this.relativeCoordinatesForEvent(mouseEvent);
        this.setState(prevState => {
            return {
                lines: prevState.lines.push(new Immutable.List([point])),
                isDrawing: true,
            };
        });
    }

    relativeCoordinatesForEvent(mouseEvent) {
        const boundingRect = this.refs.drawArea.getBoundingClientRect();
        return new Immutable.Map({
            x: mouseEvent.clientX - boundingRect.left - 10, // account for 10px border
            y: mouseEvent.clientY - boundingRect.top - 10,
        });
    }

    handleMouseMove(mouseEvent) {
        if (!this.state.isDrawing) {
            return;
        }
        const point = this.relativeCoordinatesForEvent(mouseEvent);
        this.setState(prevState => {
            return {
                lines: prevState.lines.updateIn([prevState.lines.size - 1], line => line.push(point))
            };
        });
    }

    componentDidMount() {
        this.socket.on('Drawn', (serverLine, path) => {
            if (path !== this.path)
                return;
            this.setState(prevState => {
                return {
                    lines: prevState.lines.push(
                        new Immutable.List(serverLine).map(pt =>
                            new Immutable.Map(pt))
                    )
                }
            });
        });
        document.addEventListener("mouseup", this.handleMouseUp);
    }
    componentWillUnmount() {
        document.removeEventListener("mouseup", this.handleMouseUp);
    }
    handleMouseUp() {
        this.setState({ isDrawing: false });
        this.socket.emit('Drawn', this.state.lines.get(this.state.lines.size - 1), this.path);
    }
}


function Drawing({ lines }) {
    return (
        <svg className="drawing">
            {lines.map((line, index) => (
                <DrawingLine key={index} line={line} />
            ))}
        </svg>
    );
}

function DrawingLine({ line }) {
    const pathData = "M " +
        line
            .map(p => {
                return `${p.get('x')} ${p.get('y')}`;
            })
            .join(" L ");

    return <path className="path" d={pathData} />;
}
export default ForeverBoard;