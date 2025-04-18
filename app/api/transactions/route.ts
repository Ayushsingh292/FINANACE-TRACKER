import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: Request) {
  try {
    const { amount, description, date, category } = await req.json();

    if (!amount || !description || !date || !category) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('finance-tracker');
    const transactions = db.collection('transactions');

    const result = await transactions.insertOne({
      amount,
      description,
      date: new Date(date),
      category,
      createdAt: new Date(),
    });

    const updatedTransactions = await transactions.find().sort({ createdAt: -1 }).toArray();

    return NextResponse.json(updatedTransactions, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error saving transaction' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("finance-tracker");
    const collection = db.collection("transactions");

    const transactions = await collection.find().sort({ createdAt: -1 }).toArray();

    return NextResponse.json(transactions);
  } catch (err) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    const client = await clientPromise;
    const db = client.db("finance-tracker");
    const collection = db.collection("transactions");

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 1) {
      const updatedTransactions = await collection.find().sort({ createdAt: -1 }).toArray();
      return NextResponse.json(updatedTransactions);
    } else {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
  } catch (err) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
