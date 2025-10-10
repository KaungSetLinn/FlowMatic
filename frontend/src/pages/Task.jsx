import { Link } from "react-router-dom";

const Task = () => {
    return (
        <div>
            <Link to="/task/new">
            <button className="px-5 py-3 rounded bg-blue-600 hover:bg-blue-700 hover:cursor-pointer
            text-white text-xl font-bold">
                新しいタスクを作成
            </button>
            </Link>
        </div>
    )
}

export default Task;