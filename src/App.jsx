import React, { useState, useEffect } from "react";

const DEFAULT_USERS = [
  { name: "Admin", id: "A001", pass: "1234", role: "Admin", approved: true },
];

function clean(value) {
  return String(value ?? "").trim();
}

function positiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export default function App() {
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("login");

  // Load data from localStorage
  useEffect(() => {
    try {
      const b = JSON.parse(localStorage.getItem("lib_books"));
      const u = JSON.parse(localStorage.getItem("lib_users"));
      const t = JSON.parse(localStorage.getItem("lib_tx"));
      const o = JSON.parse(localStorage.getItem("lib_orders"));

      if (Array.isArray(b)) setBooks(b);
      if (Array.isArray(u) && u.length > 0) setUsers(u);
      if (Array.isArray(t)) setTransactions(t);
      if (Array.isArray(o)) setOrders(o);
    } catch (err) {
      console.error("Error loading data", err);
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem("lib_books", JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem("lib_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("lib_tx", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("lib_orders", JSON.stringify(orders));
  }, [orders]);

  const isAdmin = currentUser?.role === "Admin";
  const canManageBooks =
    currentUser &&
    (currentUser.role === "Admin" || currentUser.role === "Librarian");
  const canApproveOrders = currentUser?.role === "Admin";

  const showPage = (name) => {
    if (!currentUser && name !== "login") {
      setPage("login");
      return;
    }
    setPage(name);
  };

  const doLogout = () => {
    setCurrentUser(null);
    setPage("login");
  };

  // ==================== LOGIN PAGE ====================
  const LoginPage = () => {
    const [id, setId] = useState("");
    const [pass, setPass] = useState("");

    const handleLogin = () => {
      const found = users.find(
        (u) => u.id === clean(id) && u.pass === pass
      );

      if (!found) {
        alert("Invalid ID or Password.");
        return;
      }

      if (found.role === "Member" && found.approved === false) {
        alert(
          "Your membership has not yet been approved by an administrator."
        );
        return;
      }

      setCurrentUser(found);
      setPage("dashboard");
    };

    return (
      <div className="login-wrapper">
        <div className="card login-card">
          <h3>Community Library Login</h3>
          <p className="muted">Sign in to manage the library.</p>
          <input
            placeholder="Membership ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          <button className="btn full-width" onClick={handleLogin}>
            Login
          </button>
        </div>
      </div>
    );
  };

  // ==================== DASHBOARD ====================
  const DashboardPage = () => {
    const totalTitles = books.length;
    const totalCopies = books.reduce(
      (sum, b) => sum + Number(b.qty || 0),
      0
    );
    const lowStock = books.filter((b) => Number(b.qty || 0) < 2).length;
    const pending = orders.filter((o) => o.status === "Pending").length;

    const stats = [
      ["Book Titles", totalTitles],
      ["Copies in Stock", totalCopies],
      ["Low Stock", lowStock],
      ...(isAdmin ? [["Pending Orders", pending]] : []),
    ];

    return (
      <>
        <h2>Welcome, {currentUser.name}</h2>

        <div className="stats-grid">
          {stats.map(([label, value]) => (
            <div className="stat" key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3>Book Availability</h3>
          {books.length === 0 ? (
            <p className="empty">No books have been added yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Genre</th>
                  <th>ISBN</th>
                  <th>Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.isbn}>
                    <td>{b.title}</td>
                    <td>{b.author}</td>
                    <td>{b.genre}</td>
                    <td>{b.isbn}</td>
                    <td className={Number(b.qty) < 2 ? "low" : ""}>
                      {b.qty}
                    </td>
                    <td
                      className={
                        Number(b.qty) < 2 ? "status-low" : "status-ok"
                      }
                    >
                      {Number(b.qty) < 2 ? "Low stock" : "Available"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!isAdmin && currentUser.role === "Member" && (
          <div className="card">
            <h3>My Book Orders</h3>
            <ul className="history">
              {orders.filter((o) => o.memberId === currentUser.id).length ===
              0 ? (
                <li className="empty">
                  You have not placed any book orders.
                </li>
              ) : (
                orders
                  .filter((o) => o.memberId === currentUser.id)
                  .slice()
                  .reverse()
                  .map((o) => (
                    <li key={o.id}>
                      {o.bookTitle} — {o.status}
                      {o.returnDate ? ` | Return by: ${o.returnDate}` : ""}
                    </li>
                  ))
              )}
            </ul>
          </div>
        )}
      </>
    );
  };

  // ==================== BOOKS PAGE ====================
  const BooksPage = () => {
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [genre, setGenre] = useState("");
    const [isbn, setIsbn] = useState("");
    const [qty, setQty] = useState("");

    const addBook = () => {
      const t = clean(title);
      const a = clean(author);
      const g = clean(genre);
      const i = clean(isbn);
      const q = Number(qty);

      if (
        !t ||
        !a ||
        !g ||
        !/^[0-9]+$/.test(i) ||
        !Number.isInteger(q) ||
        q < 0
      ) {
        alert("Please complete all fields. ISBN must contain numbers only.");
        return;
      }

      if (books.some((b) => b.isbn === i)) {
        alert("A book with this ISBN already exists.");
        return;
      }

      setBooks([...books, { title: t, author: a, genre: g, isbn: i, qty: q }]);
      setTitle("");
      setAuthor("");
      setGenre("");
      setIsbn("");
      setQty("");
    };

    const updateBook = (index, updated) => {
      const newBooks = [...books];
      newBooks[index] = updated;
      setBooks(newBooks);
    };

    const deleteBook = (index) => {
      if (confirm(`Delete "${books[index].title}"?`)) {
        setBooks(books.filter((_, i) => i !== index));
      }
    };

    if (!canManageBooks) {
      return (
        <>
          <h2>Available Books</h2>
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Genre</th>
                  <th>ISBN</th>
                  <th>Available</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.isbn}>
                    <td>{b.title}</td>
                    <td>{b.author}</td>
                    <td>{b.genre}</td>
                    <td>{b.isbn}</td>
                    <td>{Number(b.qty) > 0 ? b.qty : "Out of Stock"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted">To order a book, open Transactions.</p>
          </div>
        </>
      );
    }

    return (
      <>
        <h2>Book Management</h2>

        <div className="card">
          <h3>Add New Book</h3>
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            placeholder="Author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <input
            placeholder="Genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          />
          <input
            placeholder="ISBN (numbers only)"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            inputMode="numeric"
          />
          <input
            type="number"
            placeholder="Initial Quantity"
            min="0"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          <button className="btn" onClick={addBook}>
            Add Book
          </button>
        </div>

        <div className="card">
          <h3>Manage Books</h3>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Genre</th>
                <th>ISBN</th>
                <th>Qty</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b, i) => (
                <BookRow
                  key={b.isbn}
                  book={b}
                  index={i}
                  onUpdate={updateBook}
                  onDelete={deleteBook}
                  books={books}
                />
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  // Helper component for editable book row
  const BookRow = ({ book, index, onUpdate, onDelete, books }) => {
    const [title, setTitle] = useState(book.title);
    const [author, setAuthor] = useState(book.author);
    const [genre, setGenre] = useState(book.genre);
    const [isbn, setIsbn] = useState(book.isbn);
    const [qty, setQty] = useState(book.qty);

    const handleUpdate = () => {
      const t = clean(title);
      const a = clean(author);
      const g = clean(genre);
      const i = clean(isbn);
      const q = Number(qty);

      if (
        !t ||
        !a ||
        !g ||
        !/^[0-9]+$/.test(i) ||
        !Number.isInteger(q) ||
        q < 0
      ) {
        alert("Enter valid details. ISBN must contain numbers only.");
        return;
      }

      if (books.some((b, idx) => idx !== index && b.isbn === i)) {
        alert("Another book already uses this ISBN.");
        return;
      }

      onUpdate(index, { title: t, author: a, genre: g, isbn: i, qty: q });
    };

    return (
      <tr>
        <td>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </td>
        <td>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} />
        </td>
        <td>
          <input value={genre} onChange={(e) => setGenre(e.target.value)} />
        </td>
        <td>
          <input
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            inputMode="numeric"
          />
        </td>
        <td>
          <input
            type="number"
            min="0"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </td>
        <td>
          <div className="actions">
            <button className="btn" onClick={handleUpdate}>
              Update
            </button>
            <button className="btn danger" onClick={() => onDelete(index)}>
              Delete
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // ==================== TRANSACTIONS PAGE ====================
  const TransactionsPage = () => {
    // Member view
    if (currentUser.role === "Member") {
      const availableBooks = books.filter((b) => Number(b.qty) > 0);
      const [selectedBook, setSelectedBook] = useState(
        availableBooks[0] ? books.indexOf(availableBooks[0]) : ""
      );
      const [quantity, setQuantity] = useState("1");

      const placeOrder = () => {
        const book = books[Number(selectedBook)];
        const q = positiveInt(quantity);

        if (!book || !q) {
          alert("Select a book and enter a valid quantity.");
          return;
        }
        if (q > Number(book.qty)) {
          alert("You cannot order more copies than are available.");
          return;
        }

        const newOrder = {
          id: Date.now().toString(),
          memberId: currentUser.id,
          memberName: currentUser.name,
          bookIsbn: book.isbn,
          bookTitle: book.title,
          quantity: q,
          orderDate: new Date().toLocaleString(),
          status: "Pending",
          returnDate: "",
        };

        setOrders([...orders, newOrder]);
        alert("Your order has been sent to the administrator for approval.");
        setQuantity("1");
      };

      return (
        <>
          <h2>Transactions</h2>

          <div className="card">
            <h3>Order a Book</h3>
            {availableBooks.length === 0 ? (
              <p className="empty">No books are currently available to order.</p>
            ) : (
              <>
                <select
                  value={selectedBook}
                  onChange={(e) => setSelectedBook(e.target.value)}
                >
                  {availableBooks.map((b) => (
                    <option key={b.isbn} value={books.indexOf(b)}>
                      {b.title} — {b.qty} available
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <button className="btn" onClick={placeOrder}>
                  Place Order
                </button>
              </>
            )}
          </div>

          <div className="card">
            <h3>My Orders</h3>
            {orders.filter((o) => o.memberId === currentUser.id).length ===
            0 ? (
              <p className="empty">You have not placed any orders yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Quantity</th>
                    <th>Order Date</th>
                    <th>Status</th>
                    <th>Return Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .filter((o) => o.memberId === currentUser.id)
                    .slice()
                    .reverse()
                    .map((o) => (
                      <tr key={o.id}>
                        <td>{o.bookTitle}</td>
                        <td>{o.quantity}</td>
                        <td>{o.orderDate}</td>
                        <td>{o.status}</td>
                        <td>{o.returnDate || "—"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      );
    }

    // Staff / Admin view
    const [selectedBook, setSelectedBook] = useState(0);
    const [txType, setTxType] = useState("add");
    const [txQty, setTxQty] = useState("");

    const submitTransaction = () => {
      const i = Number(selectedBook);
      const q = positiveInt(txQty);

      if (!books[i] || !q) {
        alert("Select a book and enter a quantity greater than zero.");
        return;
      }
      if (txType === "borrow" && q > Number(books[i].qty)) {
        alert("Cannot borrow more copies than are in stock.");
        return;
      }

      const newBooks = [...books];
      if (txType === "add") newBooks[i].qty += q;
      else newBooks[i].qty -= q;
      setBooks(newBooks);

      setTransactions([
        ...transactions,
        {
          date: new Date().toLocaleString(),
          book: books[i].title,
          type: txType,
          qty: q,
          user: currentUser.name,
        },
      ]);

      setTxQty("");
    };

    const approveOrder = (order) => {
      const book = books.find((b) => b.isbn === order.bookIsbn);
      if (!book || Number(book.qty) < Number(order.quantity)) {
        alert(
          "This order cannot be approved because there is not enough stock."
        );
        return;
      }

      const returnDate = prompt("Enter the return date (e.g. 30/09/2026):");
      if (!returnDate || !clean(returnDate)) {
        alert("Approval cancelled. A return date is required.");
        return;
      }

      // Update stock
      const newBooks = books.map((b) =>
        b.isbn === order.bookIsbn
          ? { ...b, qty: b.qty - Number(order.quantity) }
          : b
      );
      setBooks(newBooks);

      // Update order
      const newOrders = orders.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: "Approved",
              returnDate: clean(returnDate),
              approvedBy: currentUser.name,
              approvedDate: new Date().toLocaleString(),
            }
          : o
      );
      setOrders(newOrders);

      // Add transaction
      setTransactions([
        ...transactions,
        {
          date: new Date().toLocaleString(),
          book: book.title,
          type: "approved borrow",
          qty: Number(order.quantity),
          user: order.memberName,
        },
      ]);
    };

    const rejectOrder = (order) => {
      const reason = prompt("Reason for rejection (optional):", "");
      const newOrders = orders.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: "Rejected",
              rejectionReason: clean(reason),
              rejectedBy: currentUser.name,
            }
          : o
      );
      setOrders(newOrders);
    };

    return (
      <>
        <h2>Transactions</h2>

        <div className="card">
          <h3>Add / Deduct Stock</h3>
          {books.length === 0 ? (
            <p className="empty">
              Add a book before recording a stock transaction.
            </p>
          ) : (
            <>
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
              >
                {books.map((b, i) => (
                  <option key={b.isbn} value={i}>
                    {b.title} ({b.qty} in stock)
                  </option>
                ))}
              </select>
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value)}
              >
                <option value="add">Add Stock</option>
                <option value="borrow">Record Borrow</option>
              </select>
              <input
                type="number"
                min="1"
                placeholder="Quantity"
                value={txQty}
                onChange={(e) => setTxQty(e.target.value)}
              />
              <button className="btn" onClick={submitTransaction}>
                Submit Transaction
              </button>
            </>
          )}
        </div>

        {canApproveOrders && (
          <div className="card">
            <h3>Member Orders — Approval</h3>
            {orders.filter((o) => o.status === "Pending").length === 0 ? (
              <p className="empty">No pending orders.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Book</th>
                    <th>Qty</th>
                    <th>Order Date</th>
                    <th>Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .filter((o) => o.status === "Pending")
                    .map((order) => (
                      <tr key={order.id}>
                        <td>{order.memberName}</td>
                        <td>{order.bookTitle}</td>
                        <td>{order.quantity}</td>
                        <td>{order.orderDate}</td>
                        <td>
                          <div className="actions">
                            <button
                              className="btn"
                              onClick={() => approveOrder(order)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn danger"
                              onClick={() => rejectOrder(order)}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="card">
          <h3>Transaction History</h3>
          <ul className="history">
            {transactions.length === 0 ? (
              <li className="empty">No transactions recorded yet.</li>
            ) : (
              transactions
                .slice()
                .reverse()
                .map((t, i) => (
                  <li key={i}>
                    {t.date} — {t.type} {t.qty} of "{t.book}" by{" "}
                    {t.user || "Unknown user"}
                  </li>
                ))
            )}
          </ul>
        </div>
      </>
    );
  };

  // ==================== USERS PAGE ====================
  const UsersPage = () => {
    const [name, setName] = useState("");
    const [id, setId] = useState("");
    const [pass, setPass] = useState("");
    const [role, setRole] = useState("Member");

    if (!isAdmin) {
      return (
        <>
          <h2>User Management</h2>
          <div className="card">
            <h3>Access Restricted</h3>
            <p>Only administrators can manage user accounts.</p>
          </div>
        </>
      );
    }

    const addUser = () => {
      const n = clean(name);
      const i = clean(id);
      if (!n || !i || !pass) {
        alert("Please complete all user fields.");
        return;
      }
      if (users.some((u) => u.id === i)) {
        alert("That membership ID already exists.");
        return;
      }

      setUsers([
        ...users,
        { name: n, id: i, pass, role, approved: true },
      ]);
      setName("");
      setId("");
      setPass("");
      setRole("Member");
    };

    const updateUser = (index, updated) => {
      const newUsers = [...users];
      newUsers[index] = updated;
      setUsers(newUsers);

      // Update currentUser if it's the same account
      if (currentUser.id === updated.id) {
        setCurrentUser(updated);
      }
    };

    const deleteUser = (index) => {
      if (users.length === 1) {
        alert("At least one user account must remain.");
        return;
      }
      if (users[index].id === currentUser.id) {
        alert("You cannot delete your current account.");
        return;
      }
      if (confirm(`Delete user "${users[index].name}"?`)) {
        setUsers(users.filter((_, i) => i !== index));
      }
    };

    return (
      <>
        <h2>User Management</h2>

        <div className="card">
          <h3>Add User</h3>
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Membership ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Member">Member</option>
            <option value="Librarian">Librarian</option>
            <option value="Admin">Admin</option>
          </select>
          <button className="btn" onClick={addUser}>
            Add User
          </button>
        </div>

        <div className="card">
          <h3>All Users</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
                <th>Role</th>
                <th>Password</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <UserRow
                  key={u.id}
                  user={u}
                  index={i}
                  onUpdate={updateUser}
                  onDelete={deleteUser}
                />
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const UserRow = ({ user, index, onUpdate, onDelete }) => {
    const [name, setName] = useState(user.name);
    const [pass, setPass] = useState(user.pass);
    const [role, setRole] = useState(user.role);

    const handleUpdate = () => {
      const n = clean(name);
      if (!n || !pass) {
        alert("Name and password cannot be empty.");
        return;
      }
      onUpdate(index, {
        ...user,
        name: n,
        pass,
        role,
        approved: true,
      });
    };

    return (
      <tr>
        <td>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </td>
        <td>{user.id}</td>
        <td>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Member">Member</option>
            <option value="Librarian">Librarian</option>
            <option value="Admin">Admin</option>
          </select>
        </td>
        <td>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
        </td>
        <td>
          <div className="actions">
            <button className="btn" onClick={handleUpdate}>
              Update
            </button>
            <button className="btn danger" onClick={() => onDelete(index)}>
              Delete
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // ==================== MAIN RENDER ====================
  return (
    <>
      <header>Community Library</header>

      {currentUser && (
        <nav className="top-nav">
          <button
            className={page === "dashboard" ? "active" : ""}
            onClick={() => showPage("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={page === "books" ? "active" : ""}
            onClick={() => showPage("books")}
          >
            Books
          </button>
          <button
            className={page === "transactions" ? "active" : ""}
            onClick={() => showPage("transactions")}
          >
            Transactions
          </button>
          {isAdmin && (
            <button
              className={page === "users" ? "active" : ""}
              onClick={() => showPage("users")}
            >
              Users
            </button>
          )}
          <button onClick={doLogout}>Logout</button>
        </nav>
      )}

      <main className="container">
        {page === "login" && <LoginPage />}
        {page === "dashboard" && <DashboardPage />}
        {page === "books" && <BooksPage />}
        {page === "transactions" && <TransactionsPage />}
        {page === "users" && <UsersPage />}
      </main>

      <footer>Community Library Management System</footer>
    </>
  );
}