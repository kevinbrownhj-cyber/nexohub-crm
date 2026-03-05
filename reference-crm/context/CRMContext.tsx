import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren } from 'react';
import { Contact, Deal, DealStage, Activity } from '../types';

interface CRMContextType {
  contacts: Contact[];
  deals: Deal[];
  activities: Activity[];
  addContact: (contact: Contact) => void;
  updateContact: (contact: Contact) => void;
  deleteContact: (id: string) => void;
  addDeal: (deal: Deal) => void;
  updateDeal: (deal: Deal) => void;
  deleteDeal: (id: string) => void;
  addActivity: (activity: Activity) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

// Mock Data Initialization - CLEARED
const initialContacts: Contact[] = [];

const initialDeals: Deal[] = [];

export const CRMProvider = ({ children }: PropsWithChildren) => {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [activities, setActivities] = useState<Activity[]>([]);

  const addContact = (contact: Contact) => setContacts([...contacts, contact]);
  const updateContact = (updated: Contact) => setContacts(contacts.map(c => c.id === updated.id ? updated : c));
  const deleteContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
    setDeals(deals.filter(d => d.contactId !== id)); // Cascade delete (simplified)
  };

  const addDeal = (deal: Deal) => setDeals([...deals, deal]);
  const updateDeal = (updated: Deal) => setDeals(deals.map(d => d.id === updated.id ? updated : d));
  const deleteDeal = (id: string) => setDeals(deals.filter(d => d.id !== id));

  const addActivity = (activity: Activity) => setActivities([activity, ...activities]);

  return (
    <CRMContext.Provider value={{
      contacts, deals, activities,
      addContact, updateContact, deleteContact,
      addDeal, updateDeal, deleteDeal, addActivity
    }}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) throw new Error("useCRM must be used within a CRMProvider");
  return context;
};