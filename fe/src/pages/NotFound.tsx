
import { Link } from "react-router-dom";
import { Button } from "../components/ui";

const NotFound = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-lg text-center">
                <div className="mb-6 text-8xl font-extrabold tracking-tight text-blue-600">
                    404
                </div>

                <h1 className="mb-3 text-3xl font-bold text-gray-900">
                    Page not found
                </h1>

                <p className="mb-8 text-gray-500">
                    Sorry, we couldn't find the page you're looking for.
                    It may have been moved or the URL may be incorrect.
                </p>

                <div className="flex flex-col justify-center gap-3 sm:flex-row">
                    <Link to="/login">
                        <Button>Back to Login</Button>
                    </Link>

                    <Button
                        variant="outline"
                        onClick={() => window.history.back()}
                    >
                        Go Back
                    </Button>
                </div>

                <p className="mt-10 text-sm text-gray-400">
                    Error code: 404 · Page not found
                </p>
            </div>
        </div>
    );
};

export default NotFound;
