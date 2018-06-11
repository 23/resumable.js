namespace Resumable.Models
{
	public class ResumableConfiguration
	{
		/// <summary>
		/// Gets or sets number of expected chunks in this upload.
		/// </summary>
		public int Chunks { get; set; }

		/// <summary>
		/// Gets or sets unique identifier for current upload.
		/// </summary>
		public string Identifier { get; set; }
		
		/// <summary>
		/// Gets or sets file name.
		/// </summary>
		public string FileName { get; set; }

		public ResumableConfiguration()
		{

		}

		/// <summary>
		/// Creates an object with file upload configuration.
		/// </summary>
		/// <param name="identifier">Upload unique identifier.</param>
		/// <param name="filename">File name.</param>
		/// <param name="chunks">Number of file chunks.</param>
		/// <returns>File upload configuration.</returns>
		public static ResumableConfiguration Create(string identifier, string filename, int chunks)
		{
			return new ResumableConfiguration { Identifier = identifier, FileName = filename, Chunks = chunks };
		}
	}
}