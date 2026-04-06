import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import AddEvent from "./AddEvent";

import Events from "./Events";

import Compare from "./Compare";

import EventDetails from "./EventDetails";

import EditEvent from "./EditEvent";

import TeamMembers from "./TeamMembers";

import AddTeamMember from "./AddTeamMember";

import TeamMemberDetails from "./TeamMemberDetails";

import EditTeamMember from "./EditTeamMember";

import CRM from "./CRM";

import AddInvoice from "./AddInvoice";

import AddClient from "./AddClient";

import EditClient from "./EditClient";

import EditInvoice from "./EditInvoice";

import AddQuote from "./AddQuote";

import EditQuote from "./EditQuote";

import ClientDetails from "./ClientDetails";

import InvoiceDetails from "./InvoiceDetails";

import QuoteDetails from "./QuoteDetails";

import Chat from "./Chat";

import InformationGuide from "./InformationGuide";

import VisualGuideEditor from "./VisualGuideEditor";

import EventsMap from "./EventsMap";

import AddContract from "./AddContract";

import ContractDetails from "./ContractDetails";

import EditContract from "./EditContract";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    AddEvent: AddEvent,
    
    Events: Events,
    
    Compare: Compare,
    
    EventDetails: EventDetails,
    
    EditEvent: EditEvent,
    
    TeamMembers: TeamMembers,
    
    AddTeamMember: AddTeamMember,
    
    TeamMemberDetails: TeamMemberDetails,
    
    EditTeamMember: EditTeamMember,
    
    CRM: CRM,
    
    AddInvoice: AddInvoice,
    
    AddClient: AddClient,
    
    EditClient: EditClient,
    
    EditInvoice: EditInvoice,
    
    AddQuote: AddQuote,
    
    EditQuote: EditQuote,
    
    ClientDetails: ClientDetails,
    
    InvoiceDetails: InvoiceDetails,
    
    QuoteDetails: QuoteDetails,
    
    Chat: Chat,
    
    InformationGuide: InformationGuide,
    
    VisualGuideEditor: VisualGuideEditor,
    
    EventsMap: EventsMap,
    
    AddContract: AddContract,
    
    ContractDetails: ContractDetails,
    
    EditContract: EditContract,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/AddEvent" element={<AddEvent />} />
                
                <Route path="/Events" element={<Events />} />
                
                <Route path="/Compare" element={<Compare />} />
                
                <Route path="/EventDetails" element={<EventDetails />} />
                
                <Route path="/EditEvent" element={<EditEvent />} />
                
                <Route path="/TeamMembers" element={<TeamMembers />} />
                
                <Route path="/AddTeamMember" element={<AddTeamMember />} />
                
                <Route path="/TeamMemberDetails" element={<TeamMemberDetails />} />
                
                <Route path="/EditTeamMember" element={<EditTeamMember />} />
                
                <Route path="/CRM" element={<CRM />} />
                
                <Route path="/AddInvoice" element={<AddInvoice />} />
                
                <Route path="/AddClient" element={<AddClient />} />
                
                <Route path="/EditClient" element={<EditClient />} />
                
                <Route path="/EditInvoice" element={<EditInvoice />} />
                
                <Route path="/AddQuote" element={<AddQuote />} />
                
                <Route path="/EditQuote" element={<EditQuote />} />
                
                <Route path="/ClientDetails" element={<ClientDetails />} />
                
                <Route path="/InvoiceDetails" element={<InvoiceDetails />} />
                
                <Route path="/QuoteDetails" element={<QuoteDetails />} />
                
                <Route path="/Chat" element={<Chat />} />
                
                <Route path="/InformationGuide" element={<InformationGuide />} />
                
                <Route path="/VisualGuideEditor" element={<VisualGuideEditor />} />
                
                <Route path="/EventsMap" element={<EventsMap />} />
                
                <Route path="/AddContract" element={<AddContract />} />
                
                <Route path="/ContractDetails" element={<ContractDetails />} />
                
                <Route path="/EditContract" element={<EditContract />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}