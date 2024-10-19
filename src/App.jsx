import { useState } from 'react';

export default function Component() {
  const [searchTerm, setSearchTerm] = useState('');
  const [fetched,setFetched] = useState(false);
  const [loading,setLoading] = useState(false);
  const [qualifiers, setQualifiers] = useState({
    author: '',
    maintainer: '',
    keywords: '',
    deprecated: false,
    'not-deprecated': false,
    unstable: false,
    'not-unstable': false,
    insecure: false,
    'boost-exact': false,
    'not-insecure': false,
    scoreEffect: '',
    scoreQuality: '',
    scorePopularity: '',
    scoreMaintenance: '',
  });
  const [packages, setPackages] = useState([]);
  const [sortBy, setSortBy] = useState('');
  const [size, setSize] = useState(10);

  const handleSearch = async () => {
    setLoading(true);
    let query = searchTerm;
    for (const [key, value] of Object.entries(qualifiers)) {
      if (['author', 'maintainer', 'keywords'].includes(key) && value !== '') {
        query += `+${key}:${value}`;
      } else if (['deprecated', 'insecure', 'unstable'].includes(key) && value) {
        query += `+is:${key}`;
      } else if (['not-deprecated', 'not-insecure', 'not-unstable'].includes(key) && value) {
        query += `+not:${key.replace('not-', '')}`;
      } else if (key.startsWith('score') && value !== '') {
        query += `+${key.toLowerCase().replace('score', '')+"-weight"}:${value}`;
      }
    }

    const response = await fetch(`https://api.npms.io/v2/search?q=${query}&size=${size}`);
    const data = await response.json();

    const packageNames = data.results.map(result => result.package.name);
    const detailedResponse = await fetch('https://api.npms.io/v2/package/mget', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(packageNames),
    });
    const detailedData = await detailedResponse.json();

    const packagesWithDetails = await Promise.all(data.results.map(async (result) => {
      if (!result.package.links.repository) return {
        ...result,
        details: detailedData[result.package.name],
        starHistory: 'N/A', // Set starHistory to 'N/A' if no repository
      };
      const githubUrl = result.package.links.repository;
      const repoPath = githubUrl.split("https://github.com/")[1];
      const starHistoryResponse = await fetch(`https://api.star-history.com/svg?repos=${repoPath}&type=Date`);
      const starHistorySvg = await starHistoryResponse.text();
      return {
        ...result,
        details: detailedData[result.package.name],
        starHistory: starHistorySvg,
      };
    }));
    setFetched(true);
    setLoading(false);
    setPackages(packagesWithDetails);
  };

  const handleSort = (criteria) => {
    setSortBy(criteria);
    const sortedPackages = [...packages].sort((a, b) => {
      if (criteria === 'stars') {
        return b.details.collected.github.starsCount - a.details.collected.github.starsCount;
      } else if (criteria === 'downloads') { // Corrected: else if instead of elif
        return b.details.evaluation.popularity.downloadsCount - a.details.evaluation.popularity.downloadsCount;
      } else if (criteria === 'downloadsAcceleration') { // Corrected: else if instead of elif
        return b.details.evaluation.popularity.downloadsAcceleration - a.details.evaluation.popularity.downloadsAcceleration;
      }
      else {
        return b.score.detail[criteria] - a.score.detail[criteria];
      }
    });
    setPackages(sortedPackages);
    
  };

  const ScoreCircle = ({ score, label }) => {
    const percentage = score * 100;
    const color = `hsl(${percentage}, 100%, 50%)`;
    return (
      <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16"> {/* Responsive width and height */}
        <svg className="w-full h-full" viewBox="0 0  36 36">
          <circle cx="18" cy="18" r="16" fill="none" className="stroke-gray-200" strokeWidth="2" />
          <circle cx="18" cy="18" r="16" fill="none" stroke={color} strokeWidth="2"
            strokeDasharray={`${percentage * 1.256} 100`} transform="rotate(-90 18 18)" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-semibold sm:text-sm md:text-base">{score.toFixed(1)}</span> {/* Responsive font size */}
           {/* Responsive font size */}
        </div>
        <p className="text-center text-xxs sm:text-xs md:text-sm">{label}</p>
      </div>
    );
  };

  const addViewBoxToSvg = (svgString) => {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;
    
    // Set viewBox to maintain aspect ratio
    svgElement.setAttribute('viewBox', '0 0 800 600');
    
    // Remove fixed width and height
    svgElement.removeAttribute('width');
    svgElement.removeAttribute('height');
    
    // Add responsive attributes
    svgElement.setAttribute('width', '100%');
    svgElement.setAttribute('height', '50vh');
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    return new XMLSerializer().serializeToString(svgDoc);
  };

  function formatNumber(number) {
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + "M";
    } else if (number >= 1000) {
      return (number / 1000).toFixed(1) + "k";
    } else {
      return number.toFixed(1);
    }
  }

  return (
    <div className="p-6">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold">npmgit</h1>
        <h3 className="text-xl text-center text-gray-400">Your npm stats along with github star history</h3>
      </header>
      <div className="flex items-center mb-6 space-x-2 w-[80vw] mx-auto">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for npm packages"
          className="flex-grow p-2 border rounded"
        />
        <button onClick={handleSearch} className="px-4 py-2 text-white bg-blue-500 rounded">Search</button>
      </div>
      <div className="mb-4">
        <h3 className="mb-2 text-lg font-semibold">Optional Qualifiers:</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <input
            type="text"
            placeholder="Author"
            value={qualifiers.author}
            onChange={(e) => setQualifiers({...qualifiers, author: e.target.value})}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Maintainer"
            value={qualifiers.maintainer}
            onChange={(e) => setQualifiers({...qualifiers, maintainer: e.target.value})}
            className="p-2 border rounded"
          />
          </div>
          <input
            type="text"
            placeholder="Keywords (comma-separated)"
            value={qualifiers.keywords}
            onChange={(e) => setQualifiers({...qualifiers, keywords: e.target.value})}
            className="w-full p-2 mt-3 border rounded"
          />
        <div className="grid grid-cols-2 gap-2 mt-4 md:grid-cols-3 lg:grid-cols-4">
          {['deprecated', 'not-deprecated', 'unstable', 'not-unstable', 'insecure', 'not-insecure', 'boost-exact'].map((qualifier) => (
            <label key={qualifier} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={qualifiers[qualifier]}
                onChange={(e) => setQualifiers({...qualifiers, [qualifier]: e.target.checked})}
                className="form-checkbox"
              />
              <span>{qualifier.charAt(0).toUpperCase() + qualifier.slice(1).replace('-', ' ')}</span>
            </label>
          ))}
        </div>
        <p className='text-center text-gray-400'>If contradictory qualifiers are selected, the positive one takes precedence.</p>
        <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2 lg:grid-cols-4">
          <div className='flex flex-col'>
          <label htmlFor="optimal" className="block">Optimal Score weightage:</label>
          <input
            type="number"
            placeholder="Default=15.3, Range: 0.05 - 100"
            value={qualifiers.scoreEffect}
            onChange={(e) => setQualifiers({...qualifiers, scoreEffect: e.target.value})}
            min="0.05"
            step="0.05"
            max="100"
            className="p-2 border rounded"
            id="optimal"
          />
          
          </div>
          <div className='flex flex-col'>
          <label htmlFor="quality" className="block">Quality Score weightage:</label>
          <input
            type="number"
            placeholder="Default=1.95, Range: 0.05 - 100"
            min="0.05"
            step="0.05"
            max="100"
            value={qualifiers.scoreQuality}
            onChange={(e) => setQualifiers({...qualifiers, scoreQuality: e.target.value})}
            className="p-2 border rounded"
            id="quality"
          />
          
          </div>
          <div className='flex flex-col'>
          <label htmlFor="popularity" className="block">Popularity Score weightage:</label>
          <input
            type="number"
            min="0.05"
            step="0.05"
            max="100"
            placeholder="Default=3.3, Range: 0.05 - 100"
            value={qualifiers.scorePopularity}
            onChange={(e) => setQualifiers({...qualifiers, scorePopularity: e.target.value})}
            className="p-2 border rounded"
            id="popularity"
          />
          
          </div>
          <div className='flex flex-col'>
          <label htmlFor="maintenance" className="block">Maintenance Score weightage:</label>
          <input
            type="number"
            min="0.05"
            step="0.05"
            max="100"
            placeholder="Default=2.05, Range: 0.05 - 100"
            value={qualifiers.scoreMaintenance}
            onChange={(e) => setQualifiers({...qualifiers, scoreMaintenance: e.target.value})}
            className="p-2 border rounded"
            id="maintenance"
          />
          
          </div>
      </div>
        <div className="mt-4">
          <label className="block mb-2">Number of packages to fetch (max 250):</label>
          <input
            type="number"
            min="1"
            max="250"
            value={size}
            onChange={(e) => setSize(Math.min(250, Math.max(1, parseInt(e.target.value))))}
            className="p-2 border rounded"
          />
        </div>
      </div>
      {loading && <h2 className='text-xl text-center text-yellow-500'>Loading...</h2>}
      {(fetched && packages.length == 0) && <h2 className='text-xl text-center text-red-600'>No packages found</h2>}
      {packages.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-lg font-semibold">Sort by:</h3>
          <select value={sortBy} onChange={(e) => handleSort(e.target.value)} className="p-2 border rounded">
            <option value="">Select...</option>
            <option value="quality">Quality</option>
            <option value="popularity">Popularity</option>
            <option value="maintenance">Maintenance</option>
            <option value="stars">GitHub Stars</option>
            <option value="downloads">Total Downloads</option>
            <option value="downloadsAcceleration">Downloads Acceleration</option>
          </select>
        </div>
      )}
      <div className="grid w-full grid-cols-1 gap-4 rounded-lg">
        {packages.map((pkg, index) => (
          <div key={index} className="grid items-center w-full grid-flow-row py-3 bg-gray-900 rounded-lg sm:grid-cols-2 md:grid-cols-3 h-fit">
            <div className="flex flex-col items-center p-4 md:justify-self-start">
              <h2 className="text-2xl font-bold text-yellow-500">{pkg.package.name}</h2>
              <p className="mb-2 text-sm text-center text-gray-400">{pkg.package.description}</p>
              <div className="mb-2">
                <a href={pkg.package.links.npm} target="_blank" rel="noopener noreferrer" className="mr-2 text-blue-500 hover:underline">NPM</a>
                <a href={pkg.package.links.repository} target="_blank" rel="noopener noreferrer" className="mr-2 text-blue-500 hover:underline">GitHub</a>
                <a href={pkg.package.links.homepage} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Homepage</a>
              </div>
              <div className="mb-2 text-sm">
                <strong>Publisher:</strong> {pkg.package.publisher?.username || 'N/A'}
              </div>
              <div className="flex space-x-6">
                <ScoreCircle score={pkg.score.final} label="Final" />
                <ScoreCircle score={pkg.score.detail.quality} label="Quality" />
                <ScoreCircle score={pkg.score.detail.popularity} label="Popularity" />
                <ScoreCircle score={pkg.score.detail.maintenance} label="Maintenance" />
              </div>
              </div>
              <div className="flex flex-col flex-wrap items-center gap-2 mt-4">
              <div className="flex flex-col items-center">
                <p>Total Downloads</p><p className='text-yellow-300'>{formatNumber(pkg.details.evaluation.popularity.downloadsCount)}</p> 
              </div>
              
              <div className="flex flex-col items-center">
                <p>Downloads Acceleration</p><p className='text-yellow-300'>{parseInt(pkg.details.evaluation.popularity.downloadsAcceleration)}</p>
              </div>
              <div className="flex flex-col items-center">
                <p>Github Stars</p><p className='text-yellow-300'>{formatNumber(pkg.details.collected.github.starsCount)}</p>
              </div>
            </div>
            
            <div className="md:justify-self-end">
            {pkg.starHistory === 'N/A' ? (
        <div className="flex items-center justify-center w-full text-gray-500 rounded-md">
          N/A
        </div>
      ) : (
        <div
          dangerouslySetInnerHTML={{ __html: addViewBoxToSvg(pkg.starHistory) }}
          className="w-full h-full"
        />
      )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}