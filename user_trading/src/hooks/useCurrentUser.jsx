import { useSelector } from "react-redux";

// Every surface that shows the signed-in user needs the same derived values,
// and each one was working them out again — which is how the Navbar dropdown
// ended up displaying hardcoded details while the avatar beside it was live.
// Deriving once here keeps the rail, the navbar and the dropdown identical.
const useCurrentUser = () => {
  const { user } = useSelector((store) => store.auth);

  const firstName = user?.firstName?.trim() || "";
  const lastName = user?.lastName?.trim() || "";
  const email = user?.email || "";

  // filter() stops a missing surname leaving a trailing space, and the
  // fallback keeps "undefined undefined" from flashing while the profile
  // request is still in flight.
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") || "Your Account";

  // Falls back to the email's first letter, then to a neutral glyph, so the
  // avatar is never an empty circle.
  const initials =
    `${firstName.charAt(0) || email.charAt(0)}${lastName.charAt(0)}`.toUpperCase() ||
    "U";

  return { user, firstName, lastName, email, fullName, initials };
};

export default useCurrentUser;
