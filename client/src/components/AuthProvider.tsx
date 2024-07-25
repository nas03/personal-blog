interface IPropsAuthProvider {
  children: React.ReactNode;
}
const AuthProvider: React.FC<IPropsAuthProvider> = (props) => {
  const user = JSON.parse(localStorage.get("user") || "{}");
  if (!user) return false;

  return <>{props.children}</>;
};
export default AuthProvider;
