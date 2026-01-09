import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Room, Guest, Reservation, Transaction, RoomStatus, User, Role, Staff, SalaryPayment } from '../types';
import {
    mapRoomFromDB, mapRoomToDB,
    mapGuestFromDB, mapGuestToDB,
    mapReservationFromDB, mapReservationToDB,
    mapTransactionFromDB, mapTransactionToDB
} from '../utils/supabaseMappers';

interface DatabaseContextType {
    rooms: Room[];
    guests: Guest[];
    reservations: Reservation[];
    transactions: Transaction[];
    users: User[];
    staff: Staff[];
    payments: SalaryPayment[];
    currentUser: User;
    loading: boolean;

    // Actions
    addReservation: (res: Omit<Reservation, 'id'>) => Promise<void>;
    updateReservation: (id: string, updates: Partial<Reservation>) => Promise<void>;
    deleteReservation: (id: string) => Promise<void>;
    updateRoomStatus: (roomNumber: string, status: RoomStatus) => Promise<void>;
    addGuest: (guest: Omit<Guest, 'id'>) => Promise<Guest | null>;
    updateGuest: (id: string, updates: Partial<Guest>) => Promise<void>;
    addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => Promise<void>;

    // User Management
    addUser: (user: Omit<User, 'id'>) => Promise<void>;
    updateUser: (id: string, updates: Partial<User>) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;

    // Staff/Payroll Management
    addStaff: (staff: Omit<Staff, 'id'>) => Promise<void>;
    updateStaff: (id: string, updates: Partial<Staff>) => Promise<void>;
    deleteStaff: (id: string) => Promise<void>;
    addSalaryPayment: (payment: Omit<SalaryPayment, 'id'>) => Promise<void>;
    updateSalaryPayment: (id: string, updates: Partial<SalaryPayment>) => Promise<void>;
    deleteSalaryPayment: (id: string) => Promise<void>;

    // Auth
    login: (user: User) => void;
    logout: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
    const context = useContext(DatabaseContext);
    if (!context) throw new Error('useDatabase must be used within a DatabaseProvider');
    return context;
};

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [guests, setGuests] = useState<Guest[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [payments, setPayments] = useState<SalaryPayment[]>([]);
    const [loading, setLoading] = useState(true);

    const [currentUser, setCurrentUser] = useState<User>({
        id: '1',
        name: 'Guest User',
        email: 'guest@hotelfountain.com',
        role: Role.FRONT_DESK
    });

    const fetchData = async () => {
        setLoading(true);

        const { data: roomsData } = await supabase.from('rooms').select('*').order('room_number');
        if (roomsData) setRooms(roomsData.map(mapRoomFromDB));

        const { data: guestsData } = await supabase.from('guests').select('*').order('name');
        if (guestsData) setGuests(guestsData.map(mapGuestFromDB));

        const { data: resData } = await supabase.from('reservations').select('*').neq('status', 'CANCELLED');
        if (resData) setReservations(resData.map(mapReservationFromDB));

        const { data: txData } = await supabase.from('transactions').select('*').order('timestamp', { ascending: false });
        if (txData) setTransactions(txData.map(mapTransactionFromDB));

        const { data: userData } = await supabase.from('users').select('*').order('name');
        if (userData && userData.length > 0) {
            setUsers(userData);
        } else {
            setUsers([{
                id: 'fallback-admin',
                name: 'System Administrator (Local)',
                email: 'admin@hotelfountain.com',
                password: 'admin123',
                role: Role.ADMIN
            }]);
        }

        const { data: staffData } = await supabase.from('staff').select('*').order('name');
        if (staffData) {
            setStaff(staffData.map(s => ({
                id: s.id,
                name: s.name,
                designation: s.designation,
                joiningDate: s.joining_date,
                baseSalary: Number(s.base_salary),
                bonus: Number(s.bonus),
                deductions: Number(s.deductions)
            })));
        }

        const { data: payData } = await supabase.from('salary_payments').select('*');
        if (payData) {
            setPayments(payData.map(p => ({
                id: p.id,
                staffId: p.staff_id,
                month: p.month,
                year: p.year,
                amount: Number(p.amount),
                status: p.status,
                timestamp: p.timestamp
            })));
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();

        // REALTIME SUBSCRIPTIONS
        const channel = supabase.channel('main-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, (payload) => {
                if (payload.eventType === 'UPDATE') {
                    setRooms(prev => prev.map(r => r.roomNumber === payload.new.room_number ? { ...r, ...mapRoomFromDB(payload.new) } : r));
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, (payload) => {
                if (payload.eventType === 'INSERT') setGuests(prev => [...prev, mapGuestFromDB(payload.new)]);
                if (payload.eventType === 'UPDATE') setGuests(prev => prev.map(g => g.id === payload.new.id ? { ...g, ...mapGuestFromDB(payload.new) } : g));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, (payload) => {
                if (payload.eventType === 'INSERT') setReservations(prev => [...prev, mapReservationFromDB(payload.new)]);
                if (payload.eventType === 'UPDATE') setReservations(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...mapReservationFromDB(payload.new) } : r));
                if (payload.eventType === 'DELETE') setReservations(prev => prev.filter(r => r.id !== payload.old.id));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setTransactions(prev => [mapTransactionFromDB(payload.new), ...prev]);
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
                if (payload.eventType === 'INSERT') setUsers(prev => [...prev, payload.new as User]);
                if (payload.eventType === 'UPDATE') setUsers(prev => prev.map(u => u.id === payload.new.id ? { ...u, ...payload.new } : u));
                if (payload.eventType === 'DELETE') setUsers(prev => prev.filter(u => u.id !== payload.old.id));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, (payload) => {
                const mapStaff = (s: any) => ({
                    id: s.id,
                    name: s.name,
                    designation: s.designation,
                    joiningDate: s.joining_date,
                    baseSalary: Number(s.base_salary),
                    bonus: Number(s.bonus),
                    deductions: Number(s.deductions)
                });
                if (payload.eventType === 'INSERT') setStaff(prev => [...prev, mapStaff(payload.new)]);
                if (payload.eventType === 'UPDATE') setStaff(prev => prev.map(s => s.id === payload.new.id ? mapStaff(payload.new) : s));
                if (payload.eventType === 'DELETE') setStaff(prev => prev.filter(s => s.id !== payload.old.id));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'salary_payments' }, (payload) => {
                const mapPay = (p: any) => ({
                    id: p.id,
                    staffId: p.staff_id,
                    month: p.month,
                    year: p.year,
                    amount: Number(p.amount),
                    status: p.status,
                    timestamp: p.timestamp
                });
                if (payload.eventType === 'INSERT') setPayments(prev => [mapPay(payload.new), ...prev]);
                if (payload.eventType === 'UPDATE') setPayments(prev => prev.map(p => p.id === payload.new.id ? mapPay(payload.new) : p));
                if (payload.eventType === 'DELETE') setPayments(prev => prev.filter(p => p.id !== payload.old.id));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // CRUD Actions
    const addReservation = async (res: Omit<Reservation, 'id'>) => {
        const { error } = await supabase.from('reservations').insert(mapReservationToDB(res));
        if (error) console.error("Error adding reservation:", error);
    };

    const updateReservation = async (id: string, updates: Partial<Reservation>) => {
        const { error } = await supabase.from('reservations').update(mapReservationToDB(updates)).eq('id', id);
        if (error) console.error("Error updating reservation:", error);
    };

    const deleteReservation = async (id: string) => {
        const { error } = await supabase.from('reservations').delete().eq('id', id);
        if (error) console.error("Error deleting reservation:", error);
    };

    const updateRoomStatus = async (roomNumber: string, status: RoomStatus) => {
        const { error } = await supabase.from('rooms').update({ status }).eq('room_number', roomNumber);
        if (error) console.error("Error updating room:", error);
    };

    const addGuest = async (guest: Omit<Guest, 'id'>) => {
        const { data, error } = await supabase.from('guests').insert(mapGuestToDB(guest)).select().single();
        if (error) {
            console.error("Error adding guest:", error);
            return null;
        }
        return mapGuestFromDB(data);
    };

    const updateGuest = async (id: string, updates: Partial<Guest>) => {
        const { error } = await supabase.from('guests').update(mapGuestToDB(updates)).eq('id', id);
        if (error) console.error("Error updating guest:", error);
    };

    const addTransaction = async (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
        const { error } = await supabase.from('transactions').insert(mapTransactionToDB(transaction));
        if (error) console.error("Error adding transaction:", error);
    };

    // User Actions
    const addUser = async (user: Omit<User, 'id'>) => {
        const { error } = await supabase.from('users').insert(user);
        if (error) console.error("Error adding user:", error);
    };

    const updateUser = async (id: string, updates: Partial<User>) => {
        const { error } = await supabase.from('users').update(updates).eq('id', id);
        if (error) console.error("Error updating user:", error);
    };

    const deleteUser = async (id: string) => {
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) console.error("Error deleting user:", error);
    };

    // Staff Actions (Mapping camelCase to snake_case for DB)
    const addStaff = async (staffMember: Omit<Staff, 'id'>) => {
        const dbStaff = {
            name: staffMember.name,
            designation: staffMember.designation,
            joining_date: staffMember.joiningDate,
            base_salary: staffMember.baseSalary,
            bonus: staffMember.bonus,
            deductions: staffMember.deductions
        };
        const { error } = await supabase.from('staff').insert(dbStaff);
        if (error) console.error("Error adding staff:", error);
    };

    const updateStaff = async (id: string, updates: Partial<Staff>) => {
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.designation) dbUpdates.designation = updates.designation;
        if (updates.joiningDate) dbUpdates.joining_date = updates.joiningDate;
        if (updates.baseSalary) dbUpdates.base_salary = updates.baseSalary;
        if (updates.bonus) dbUpdates.bonus = updates.bonus;
        if (updates.deductions) dbUpdates.deductions = updates.deductions;

        const { error } = await supabase.from('staff').update(dbUpdates).eq('id', id);
        if (error) console.error("Error updating staff:", error);
    };

    const deleteStaff = async (id: string) => {
        const { error } = await supabase.from('staff').delete().eq('id', id);
        if (error) console.error("Error deleting staff:", error);
    };

    const addSalaryPayment = async (payment: Omit<SalaryPayment, 'id'>) => {
        const dbPayment = {
            staff_id: payment.staffId,
            month: payment.month,
            year: payment.year,
            amount: payment.amount,
            status: payment.status
            // timestamp uses default
        };
        const { error } = await supabase.from('salary_payments').insert(dbPayment);
        if (error) console.error("Error adding salary payment:", error);
    };

    const updateSalaryPayment = async (id: string, updates: Partial<SalaryPayment>) => {
        const dbUpdates: any = {};
        if (updates.status) dbUpdates.status = updates.status;
        const { error } = await supabase.from('salary_payments').update(dbUpdates).eq('id', id);
        if (error) console.error("Error updating payment:", error);
    };

    const deleteSalaryPayment = async (id: string) => {
        const { error } = await supabase.from('salary_payments').delete().eq('id', id);
        if (error) console.error("Error deleting payment:", error);
    };

    const login = (user: User) => {
        setCurrentUser(user);
    };

    const logout = () => {
        setCurrentUser({
            id: '1',
            name: 'Guest User',
            email: 'guest@hotelfountain.com',
            role: Role.FRONT_DESK
        });
    };

    return (
        <DatabaseContext.Provider value={{
            rooms, guests, reservations, transactions, users, staff, payments, currentUser, loading,
            addReservation, updateReservation, deleteReservation, updateRoomStatus, addGuest, updateGuest, addTransaction,
            addUser, updateUser, deleteUser,
            addStaff, updateStaff, deleteStaff, addSalaryPayment, updateSalaryPayment, deleteSalaryPayment,
            login, logout
        }}>
            {children}
        </DatabaseContext.Provider>
    );
};
