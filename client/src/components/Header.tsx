import SearchBar from "./SearchBar";

const Header = () => {
  return (
    <nav className="flex flex-row justify-center flex-1 bg-slate-400 z-20 w-full">
      <div>AccuWeather Hà Nội, Hà Nội 30&deg;</div>
      <SearchBar></SearchBar>
    </nav>
  );
};
export default Header;
