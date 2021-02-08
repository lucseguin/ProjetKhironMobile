import React, {Component} from 'react';

class ErrorBoundary extends Component {
    state = {
      error: false,
      errorInfo: null
    };
    componentDidCatch(error:any, errorInfo:any) {
      this.setState({
        error: error,
        errorInfo: errorInfo
      });
    }
  
    render() {
      if (this.state.error) {
        return (
          <div style={{ whiteSpace: "pre" }}>
            {this.state.error && this.state.error.toString()}
            {this.state.error.toString()}
            {/* <p>Error occured {this.state.errorInfo.componentStack}</p> */}
          </div>
        );
      }
  
      return this.props.children;
    }
}

export default ErrorBoundary;