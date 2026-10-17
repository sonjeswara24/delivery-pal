export type Status = "Ordered" | "Packed" | "Out for delivery" | "Delivered";
export const STEPS: Status[] = ["Ordered", "Packed", "Out for delivery", "Delivered"];

export type Order = {
  id: string;
  customer: string;
  address: string;
  item: string;
  status: Status;
  eta: string;
};

export const ORDERS: Order[] = [
  { id: "TRK1001", customer: "Aarav Shah", address: "12 MG Road, Pune", item: "Wireless Earbuds", status: "Out for delivery", eta: "Today, 4–6 PM" },
  { id: "TRK1002", customer: "Diya Patel", address: "45 FC Road, Pune", item: "Running Shoes", status: "Packed", eta: "Tomorrow" },
  { id: "TRK1003", customer: "Rohan Mehta", address: "8 Baner Hills, Pune", item: "Coffee Maker", status: "Out for delivery", eta: "Today, 2–4 PM" },
  { id: "TRK1004", customer: "Isha Kulkarni", address: "22 Kothrud, Pune", item: "Backpack", status: "Delivered", eta: "Delivered 11 AM" },
  { id: "TRK1005", customer: "Kabir Joshi", address: "3 Viman Nagar, Pune", item: "Desk Lamp", status: "Ordered", eta: "In 2 days" },
  { id: "TRK1006", customer: "Meera Rao", address: "17 Aundh, Pune", item: "Books (3)", status: "Out for delivery", eta: "Today, 6–8 PM" },
];
