// filepath: frontend/src/Pages/ViewStudents.test.jsx

// Mock axios
vi.mock("axios");

// Mock components used in ViewStudents
vi.mock("../components/NavbarFaculty", () => ({
  default: () => <div data-testid="navbar-faculty">Navbar Mock</div>,
}));

vi.mock("../Components/FacultySidePanel", () => ({
  default: () => <div data-testid="faculty-sidepanel">Sidepanel Mock</div>,
}));

// Mock data
const mockStudents = [
  {
    StudentID: 1,
    fullName: "John Doe",
  },
  {
    StudentID: 2,
    fullName: "Jane Smith",
  },
];

const mockSubjectInfo = {
  SubjectName: "Mathematics",
  SubjectCode: "MATH101",
  Grade: "10",
  Section: "A",
};

describe("ViewStudents Component", () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();

    // Mock localStorage
    // Mock localStorage
    const mockLocalStorage = {
      getItem: vi.fn(() => "mock-token"),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
    });

    // Default successful response for students fetch
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        students: mockStudents,
        subjectInfo: mockSubjectInfo,
      },
    });

    // Test cases
    it("renders without crashing", async () => {
      render(
        <BrowserRouter>
          <ViewStudents />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Student List")).toBeInTheDocument();
      });
    });

    it("handles pagination correctly", async () => {
      // Mock response with more students
      const manyStudents = Array.from({ length: 12 }, (_, i) => ({
        StudentID: i + 1,
        fullName: `Student ${i + 1}`,
      }));

      axios.get.mockResolvedValueOnce({
        data: {
          success: true,
          students: manyStudents,
          subjectInfo: mockSubjectInfo,
        },
      });

      render(
        <BrowserRouter>
          <ViewStudents />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Student 1")).toBeInTheDocument();
        expect(screen.getByText("Next")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Next"));

      await waitFor(() => {
        expect(screen.getByText("Student 6")).toBeInTheDocument();
      });
    });

    it("handles unauthorized access", async () => {
      const navigate = vi.fn();
      axios.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { message: "Unauthorized" },
        },
      });

      render(
        <BrowserRouter>
          <ViewStudents />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("token");
      });
    });

    it("shows no students found message", async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          success: true,
          students: [],
          subjectInfo: mockSubjectInfo,
        },
      });

      render(
        <BrowserRouter>
          <ViewStudents />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("No students found.")).toBeInTheDocument();
      });
    });

    it("handles grade save failure", async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            message: "Failed to update grade",
          },
        },
      });

      render(
        <BrowserRouter>
          <ViewStudents />
        </BrowserRouter>
      );

      await waitFor(() => {
        const gradesButton = screen.getAllByText("Grades")[0];
        fireEvent.click(gradesButton);
      });

      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("Failed to update grade")).toBeInTheDocument();
      });
    });
  });
});

it("displays student information correctly", async () => {
  render(
    <BrowserRouter>
      <ViewStudents />
    </BrowserRouter>
  );

  await waitFor(() => {
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });
});

it("handles search functionality", async () => {
  render(
    <BrowserRouter>
      <ViewStudents />
    </BrowserRouter>
  );

  await waitFor(() => {
    const searchInput = screen.getByPlaceholderText(
      "Search by name or student ID"
    );
    fireEvent.change(searchInput, { target: { value: "John" } });
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
  });
});

it("opens grade modal when clicking Grades button", async () => {
  // Mock the grades fetch response
  axios.get.mockImplementation((url) => {
    if (url.includes("/faculty/student/")) {
      return Promise.resolve({
        data: {
          success: true,
          grades: [
            { Quarter: 1, GradeScore: 85 },
            { Quarter: 2, GradeScore: 88 },
            { Quarter: 3, GradeScore: 90 },
          ],
          activeQuarter: 4,
          averageGrade: 87.67,
        },
      });
    }
    return Promise.resolve({
      data: {
        success: true,
        students: mockStudents,
        subjectInfo: mockSubjectInfo,
      },
    });
  });

  render(
    <BrowserRouter>
      <ViewStudents />
    </BrowserRouter>
  );

  await waitFor(() => {
    const gradesButton = screen.getAllByText("Grades")[0];
    fireEvent.click(gradesButton);
  });

  await waitFor(() => {
    expect(screen.getByText("Quarter 1")).toBeInTheDocument();
    expect(screen.getByText("Quarter 4")).toBeInTheDocument();
    expect(screen.getByText("87.67")).toBeInTheDocument();
  });
});

it("handles grade input validation", async () => {
  // Setup same render and modal opening as above
  render(
    <BrowserRouter>
      <ViewStudents />
    </BrowserRouter>
  );

  await waitFor(() => {
    const gradesButton = screen.getAllByText("Grades")[0];
    fireEvent.click(gradesButton);
  });

  // Test invalid grade input
  const gradeInput = screen.getAllByPlaceholderText("Enter grade")[3]; // Quarter 4 input
  fireEvent.change(gradeInput, { target: { value: "101" } });

  await waitFor(() => {
    expect(
      screen.getByText("Grade must be between 0 and 100")
    ).toBeInTheDocument();
  });
});

it("handles successful grade save", async () => {
  axios.post.mockResolvedValueOnce({
    data: {
      success: true,
      message: "Grade updated successfully",
    },
  });

  render(
    <BrowserRouter>
      <ViewStudents />
    </BrowserRouter>
  );
});
