export const fetchData = async (endpoint, setState, timestampKey, prefix, setTimestamps) => {
  try {
    const url = `http://localhost:5000${endpoint}`;
    const response = await fetch(url, { method: 'POST' });
    const data = await response.json();
    setState(data);

    setTimestamps((prev) => ({
      ...prev,
      [timestampKey]: new Date().toLocaleString(),
    }));
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
  }
};
