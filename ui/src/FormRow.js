import React, { Component } from "react";

class FormRow extends Component {
    render() {
        return (
            <div style={{ display: "flex", "flexDirection": "row" }}>
                <div style={{ display: "flex", width: "325px" }}/>
                <div style={{ display: "flex", "flexGrow": 1 }}>
                    <div style={{ width: "300px" }}>
                        {this.props.children}
                    </div>
                </div>
            </div>
        );
    }
}

export default FormRow;
