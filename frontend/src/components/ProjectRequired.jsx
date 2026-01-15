import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";

const ProjectRequired = ({
  title = "新しいプロジェクトを作成しましょう",
  description = (
    <>
      まだプロジェクトが作成されていません。
      <br />
      まずは新しいプロジェクトを作成して、作業を始めましょう。
    </>
  ),
  icon = "📁",
  actionLabel = "プロジェクトを作成",
  actionTo = "/project/new",
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-3xl border-2 border-blue-200 shadow-sm p-8 text-center">
        <div className="text-6xl mb-4">{icon}</div>

        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          {title}
        </h2>

        <p className="text-gray-600 mb-6 text-lg leading-loose">
          {description}
        </p>

        <Link to={actionTo}>
          <button
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700
            hover:from-blue-700 hover:to-blue-800 cursor-pointer
            text-white py-3 rounded-xl font-semibold text-xl transition"
          >
            <FontAwesomeIcon
              icon={faCirclePlus}
              className="mr-3"
            />
            {actionLabel}
          </button>
        </Link>
      </div>
    </div>
  );
};

export default ProjectRequired;
