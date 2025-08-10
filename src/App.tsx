import React, { useEffect, useReducer, useState } from "react";

interface Transaction {
	title: string;
	amount: string;
	type: "earning" | "expense";
	id: string;
	earning: number;
	expense: number;
}

interface State {
	title: string;
	amount: string;
	totalAmount: number;
	type: string;
	earning: number;
	expense: number;
}

// Reducer initial state
const initialState: State = {
	title: "",
	amount: "0",
	totalAmount: 0,
	type: "",
	earning: 0,
	expense: 0,
};

const App = () => {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [state, dispatch] = useReducer(reducer, initialState);
	const [editID, setEditID] = useState<string | null>(null);

	// Load transactions + state from localStorage
	useEffect(() => {
		const storedTransactions = localStorage.getItem("transactions");
		const storedState = localStorage.getItem("trackerState");

		if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
		if (storedState) {
			const parsedState = JSON.parse(storedState);
			dispatch({ type: "load_state", payload: parsedState });
		}
	}, []);

	// Save transactions when updated
	useEffect(() => {
		localStorage.setItem("transactions", JSON.stringify(transactions));
	}, [transactions]);

	// Save reducer state when updated
	useEffect(() => {
		localStorage.setItem("trackerState", JSON.stringify(state));
	}, [state]);

	// Reducer logic
	function reducer(
		state: State,
		action: { type: string; payload?: any }
	): State {
		switch (action.type) {
			case "set_earning":
				return {
					...state,
					totalAmount: state.totalAmount + Number(action.payload),
					earning: state.earning + Number(action.payload),
				};
			case "set_expense":
				return {
					...state,
					totalAmount: state.totalAmount - Number(action.payload),
					expense: state.expense + Number(action.payload),
				};
			case "set_del_amount_earning":
				return {
					...state,
					totalAmount: state.totalAmount - Number(action.payload),
					earning: state.earning - Number(action.payload),
				};
			case "set_del_amount_expense":
				return {
					...state,
					totalAmount: state.totalAmount + Number(action.payload),
					expense: state.expense - Number(action.payload),
				};
			case "set_title":
				return { ...state, title: action.payload };
			case "set_amount":
				return { ...state, amount: action.payload };
			case "set_type":
				return { ...state, type: action.payload };
			case "reset":
				return initialState;
			case "load_state":
				return { ...state, ...action.payload };
			default:
				return state;
		}
	}

	// Generate unique ID
	const generateID = () =>
		Date.now().toString(36) + Math.random().toString(36);

	// Delete transaction
	const deleteHandler = (elemID: string, type: string) => {
		const toDelete = transactions.find((elem) => elem.id === elemID);
		if (!toDelete) return;

		dispatch({
			type: `set_del_amount_${type}`,
			payload: toDelete.amount,
		});

		setTransactions((prev) => prev.filter((elem) => elem.id !== elemID));
	};

	// Edit transaction
	const editHandler = (elemID: string) => {
		setEditID(elemID);
		const toEdit = transactions.find((elem) => elem.id === elemID);
		if (!toEdit) return;

		dispatch({ type: "set_title", payload: toEdit.title });
		dispatch({ type: "set_amount", payload: toEdit.amount });
		dispatch({ type: "set_type", payload: toEdit.type });
	};

	// Handle form submit
	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		if (editID) {
			const oldTransaction = transactions.find((t) => t.id === editID);
			if (!oldTransaction) return;

			// Remove old amount
			dispatch({
				type: `set_del_amount_${oldTransaction.type}`,
				payload: oldTransaction.amount,
			});

			// Add new amount
			if (state.type === "earning") {
				dispatch({ type: "set_earning", payload: state.amount });
			} else if (state.type === "expense") {
				dispatch({ type: "set_expense", payload: state.amount });
			}

			// Update array
			setTransactions((prev) =>
				prev.map((t) =>
					t.id === editID
						? {
								...t,
								title: state.title,
								amount: state.amount,
								type: state.type as "earning" | "expense",
								expense:
									state.type === "expense"
										? Number(state.amount)
										: 0,
								earning:
									state.type === "earning"
										? Number(state.amount)
										: 0,
						  }
						: t
				)
			);

			setEditID(null);
		} else {
			// Add new
			if (state.type === "earning") {
				dispatch({ type: "set_earning", payload: state.amount });
			} else if (state.type === "expense") {
				dispatch({ type: "set_expense", payload: state.amount });
			}

			setTransactions([
				...transactions,
				{
					title: state.title,
					amount: state.amount,
					type: state.type as "earning" | "expense",
					id: generateID(),
					earning:
						state.type === "earning" ? Number(state.amount) : 0,
					expense:
						state.type === "expense" ? Number(state.amount) : 0,
				},
			]);
		}

		// Reset fields
		dispatch({ type: "set_title", payload: "" });
		dispatch({ type: "set_amount", payload: "0" });
		dispatch({ type: "set_type", payload: "" });
	}

	return (
		<div className="w-full h-screen bg-zinc-800 text-white grid place-items-center">
			<div className="container sm:w-[390px] w-[350px] min-h-[700px] mx-auto border border-zinc-600 rounded-3xl px-4 py-3">
				<h2 className="text-4xl text-center font-bold">
					Expense Tracker
				</h2>
				<div className="balance flex flex-col items-center justify-center mt-5 text-3xl">
					<div className="amount">
						<span className="text-sm uppercase">pkr</span>{" "}
						<span className="text-6xl font-bold">
							{state.totalAmount}
						</span>
					</div>
					<div className="label text-center">Your Balance</div>
				</div>

				{/* Transaction History */}
				<div className="transaction-history h-[500px] flex flex-col">
					<header className="flex justify-between items-center my-5 border-b border-zinc-600 pb-2">
						<h3>Transactions</h3>
						<button
							onClick={() => {
								setTransactions([]);
								dispatch({ type: "reset" });
							}}
							className="clear-btn bg-red-500 px-4 py-2 rounded-full">
							Clear All
						</button>
					</header>
					<div className="transaction-cards flex-1 flex flex-col gap-3 overflow-y-auto pr-2">
						{transactions.map((transaction, index) => (
							<TransactionCard
								key={transaction.id}
								transaction={transaction}
								index={index + 1}
								delHandler={deleteHandler}
								editHandler={editHandler}
							/>
						))}
					</div>
				</div>

				{/* Add Transaction */}
				<div className="add-transaction">
					<h3 className="text-2xl font-bold mb-2">Add Transaction</h3>
					<form
						onSubmit={handleSubmit}
						className="flex flex-col gap-2">
						<input
							type="text"
							onChange={(e) =>
								dispatch({
									type: "set_title",
									payload: e.target.value,
								})
							}
							value={state.title}
							placeholder="Transaction Title"
							className="bg-zinc-700 border border-zinc-600 px-4 py-2 rounded-lg"
						/>
						<input
							onChange={(e) =>
								dispatch({
									type: "set_amount",
									payload: e.target.value,
								})
							}
							value={state.amount}
							type="number"
							placeholder="Amount"
							className="bg-zinc-700 border border-zinc-600 px-4 py-2 rounded-lg"
						/>
						<div className="btns flex items-center justify-center gap-2">
							<button
								onClick={() =>
									dispatch({
										type: "set_type",
										payload: "earning",
									})
								}
								type="submit"
								className="bg-green-500 flex-1 border border-zinc-600 px-4 py-2 rounded-lg">
								Earning <span>{state.earning}</span>
							</button>
							<button
								onClick={() =>
									dispatch({
										type: "set_type",
										payload: "expense",
									})
								}
								type="submit"
								className="bg-red-500 border flex-1 border-zinc-600 px-4 py-2 rounded-lg">
								Expense <span>{state.expense}</span>
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};
export default App;

// Transaction Card Component
const TransactionCard = ({
	transaction,
	index,
	delHandler,
	editHandler,
}: {
	transaction: Transaction;
	index: number;
	delHandler: (id: string, type: string) => void;
	editHandler: (id: string) => void;
}) => {
	return (
		<div id={transaction.id} className="group w-full h-auto text-zinc-800">
			<div className="group-hover:hidden data flex items-center">
				<div
					className={`tracker-color ${
						transaction.type === "earning"
							? "bg-green-500"
							: "bg-red-500"
					} w-[30px] text-white py-2 grid place-items-center`}>
					{index}
				</div>
				<div className="transaction-details px-4 py-2 bg-white flex-1">
					{transaction.title}
				</div>
				<div className="transaction-amount bg-white px-4 py-2">
					{transaction.amount}
				</div>
			</div>

			<div className="action-btns text-white px-4 py-2 group-hover:flex hidden items-center justify-center [&>*]:flex-1 gap-2 [&>*]:rounded-full [&>*]:cursor-pointer">
				<button
					onClick={() => editHandler(transaction.id)}
					className="edit bg-green-500 hover:bg-green-600 py-2 px-4">
					Edit
				</button>
				<button
					className="del bg-red-500 hover:bg-red-600 py-2 px-4"
					onClick={() =>
						delHandler(transaction.id, transaction.type)
					}>
					Delete
				</button>
			</div>
		</div>
	);
};
