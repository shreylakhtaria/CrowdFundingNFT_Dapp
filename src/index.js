import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import App from "./App";
import CampaignDetails from "./components/CampaignDetails";

ReactDOM.render(
    <React.StrictMode>
        <Router>
            <Routes>
                <Route path="/campaign/:campaignId" element={<CampaignDetails />} />
                <Route path="/" element={<App />} />
            </Routes>
        </Router>
    </React.StrictMode>,
    document.getElementById("root")
);