import { Room, Guest, Reservation, Transaction, RoomCategory, RoomStatus, IdType, PaymentMethod, TransactionType } from '../types';

// ROOMS
export const mapRoomFromDB = (data: any): Room => ({
    id: data.id,
    roomNumber: data.room_number,
    category: data.category as RoomCategory,
    price: Number(data.price),
    status: data.status as RoomStatus
});

export const mapRoomToDB = (room: Partial<Room>) => {
    const db: any = {};
    if (room.roomNumber) db.room_number = room.roomNumber;
    if (room.category) db.category = room.category;
    if (room.price) db.price = room.price;
    if (room.status) db.status = room.status;
    return db;
};

// GUESTS
export const mapGuestFromDB = (data: any): Guest => ({
    id: data.id,
    name: data.name,
    email: data.email || '',
    phone: data.phone,
    idType: data.id_type as IdType,
    idNumber: data.id_number,
    address: data.address,
    city: data.city,
    country: data.country,
    preferences: data.preferences,
    idImageUrl: data.id_image_url,
    outstandingBalance: Number(data.outstanding_balance || 0)
});

export const mapGuestToDB = (guest: Partial<Guest>) => {
    const db: any = {};
    if (guest.name) db.name = guest.name;
    if (guest.email !== undefined) db.email = guest.email;
    if (guest.phone) db.phone = guest.phone;
    if (guest.idType) db.id_type = guest.idType;
    if (guest.idNumber) db.id_number = guest.idNumber;
    if (guest.address) db.address = guest.address;
    if (guest.city) db.city = guest.city;
    if (guest.country) db.country = guest.country;
    if (guest.preferences) db.preferences = guest.preferences;
    if (guest.idImageUrl) db.id_image_url = guest.idImageUrl;
    if (guest.outstandingBalance !== undefined) db.outstanding_balance = guest.outstandingBalance;
    return db;
};

// RESERVATIONS
export const mapReservationFromDB = (data: any): Reservation => ({
    id: data.id,
    roomIds: data.room_ids || [],
    guestIds: data.guest_ids || [],
    checkIn: data.check_in,
    checkOut: data.check_out,
    status: data.status,
    stayType: data.stay_type,
    laundry: Number(data.laundry || 0),
    miniBar: Number(data.mini_bar || 0),
    discount: Number(data.discount || 0),
    extraCharges: Number(data.extra_charges || 0),
    paidAmount: Number(data.paid_amount || 0),
    paymentMethod: data.payment_method as PaymentMethod,
    onDutyOfficer: data.on_duty_officer,
    specialRequests: data.special_requests,
    notes: data.notes,
    totalAmount: Number(data.total_amount || 0)
});

export const mapReservationToDB = (res: Partial<Reservation>) => {
    const db: any = {};
    if (res.roomIds) db.room_ids = res.roomIds;
    if (res.guestIds) db.guest_ids = res.guestIds;
    if (res.checkIn) db.check_in = res.checkIn;
    if (res.checkOut) db.check_out = res.checkOut;
    if (res.status) db.status = res.status;
    if (res.stayType) db.stay_type = res.stayType;
    if (res.laundry !== undefined) db.laundry = res.laundry;
    if (res.miniBar !== undefined) db.mini_bar = res.miniBar;
    if (res.discount !== undefined) db.discount = res.discount;
    if (res.extraCharges !== undefined) db.extra_charges = res.extraCharges;
    if (res.paidAmount !== undefined) db.paid_amount = res.paidAmount;
    if (res.paymentMethod) db.payment_method = res.paymentMethod;
    if (res.onDutyOfficer) db.on_duty_officer = res.onDutyOfficer;
    if (res.specialRequests) db.special_requests = res.specialRequests;
    if (res.notes) db.notes = res.notes;
    if (res.totalAmount !== undefined) db.total_amount = res.totalAmount;
    return db;
};

// TRANSACTIONS
export const mapTransactionFromDB = (data: any): Transaction => ({
    id: data.id,
    timestamp: data.timestamp,
    roomNumber: data.room_number,
    guestName: data.guest_name,
    type: data.type as TransactionType,
    amount: Number(data.amount)
});

export const mapTransactionToDB = (tx: Partial<Transaction>) => {
    const db: any = {};
    if (tx.roomNumber) db.room_number = tx.roomNumber;
    if (tx.guestName) db.guest_name = tx.guestName;
    if (tx.type) db.type = tx.type;
    if (tx.amount !== undefined) db.amount = tx.amount;
    // timestamp is usually auto-generated
    return db;
};
