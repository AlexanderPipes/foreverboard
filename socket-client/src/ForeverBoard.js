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

        // when full refresh is called it checks the url then retrieves the lines for that url
        // This is used to completely set the state of a drawing, done on connect and clear
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


    // This is a React component specific function that gets called
    // every time the state is updated.  Here is where we call the function
    // that turns our list of list of maps to an SVG
    // centers the draw area creates the clear button
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

    // Sends a signal to the server that says to update it's state to an empty list
    // the server should send a full refresh back to update all other users
    clear() {
        this.setState({
            lines: new Immutable.List()
        }, () => {
            this.socket.emit('Clear', this.path)
        });
    }

    // on mouse down if it isnt left click ignore and if it is start drawing
    // this starts a new line at the end of a drawing that mouse move will append to
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

    // every time the mouse moves we append to the latest line in the list the new point it is on
    // this is true until the user mouses up and "isDrawing" is false
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

    // Readct function called when this component is first mounted
    // sets the listeners for events either from the mouse or the server
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

    // emit that a line was just drawn when mouse is released and make sure to set drawing to false
    // so mouse move will not continue adding to it
    handleMouseUp() {
        this.setState({ isDrawing: false });
        this.socket.emit('Drawn', this.state.lines.get(this.state.lines.size - 1), this.path);
    }
}  // end class ForeverBoard

// Convert the internal data structure into html tags the User can see
function Drawing({ lines }) {
    return (
        <svg className="drawing">
            {lines.map((line, index) => (
                <DrawingLine key={index} line={line} />
            ))}
        </svg>
    );
}

// svg tags to start a line and connect the map of points
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